// ─────────────────────────────────────────────────────────────
// LLM Provider Abstraction
// ─────────────────────────────────────────────────────────────

import { config } from '../../../config';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../lib/errors';
import { prescriptionExtractionSchema } from '@mediloop/shared';
import type { PrescriptionExtraction } from '@mediloop/shared';

export interface LLMProvider {
  extractPrescription(ocrText: string): Promise<PrescriptionExtraction>;
  explainMedication(context: MedicationExplanationContext): Promise<string>;
}

export interface MedicationExplanationContext {
  medicationName: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  duration?: string;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a medical prescription parsing assistant for the MediLoop medication management app.

Your task is to extract structured information from OCR text of prescriptions.

IMPORTANT RULES:
1. Extract ONLY what is clearly present in the text. Do not infer, assume, or add information.
2. For each medicine, calculate a confidence score (0.0-1.0) based on how clearly it was extracted.
3. Set requiresConfirmation=true if confidence < 0.85 or if any required field is missing/ambiguous.
4. Return ONLY valid JSON. No explanations, no markdown, no code blocks.
5. Parse common prescription abbreviations:
   - OD = once daily
   - BD/BID = twice daily  
   - TDS/TID = three times daily
   - QID = four times daily
   - HS = at bedtime
   - SOS = as needed
   - AC = before meals
   - PC = after meals

Return this exact JSON structure:
{
  "doctorName": "string or null",
  "patientName": "string or null",
  "prescriptionDate": "YYYY-MM-DD or null",
  "hospitalClinic": "string or null",
  "overallConfidence": 0.0-1.0,
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "e.g. 500mg",
      "form": "e.g. tablet, syrup",
      "frequency": "e.g. twice daily",
      "duration": "e.g. 5 days",
      "instructions": "e.g. after meals",
      "confidence": 0.0-1.0,
      "requiresConfirmation": false
    }
  ]
}`;

const EXPLANATION_SYSTEM_PROMPT = `You are a medication information assistant for the MediLoop app.

IMPORTANT SAFETY RULES:
1. You can ONLY explain information already present in the prescription/medicine metadata provided.
2. Do NOT recommend changing dosage, frequency, or stopping medication.
3. Do NOT diagnose conditions.
4. Do NOT contraindicate with other medications.
5. Keep explanations simple and clear for a non-medical audience.
6. Always end with: "Always follow your doctor's instructions and consult them before making any changes."

Your response should be conversational, 2-4 sentences maximum.`;

// ─────────────────────────────────────────────────────────────
// Mock LLM Provider (development / testing)
// ─────────────────────────────────────────────────────────────

class MockLLMProvider implements LLMProvider {
  async extractPrescription(ocrText: string): Promise<PrescriptionExtraction> {
    logger.debug('Using MockLLMProvider for extraction');

    // Parse the mock OCR text in a deterministic way
    const mockResult: PrescriptionExtraction = {
      doctorName: 'Dr. Priya Sharma',
      patientName: 'John Doe',
      prescriptionDate: '2026-08-20',
      hospitalClinic: undefined,
      medicines: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          form: 'Tablet',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'After food',
          confidence: 0.95,
          requiresConfirmation: false,
        },
        {
          name: 'Paracetamol',
          dosage: '650mg',
          form: 'Tablet',
          frequency: 'Three times daily',
          duration: '3 days',
          instructions: 'As needed (SOS)',
          confidence: 0.9,
          requiresConfirmation: false,
        },
        {
          name: 'Cetirizine Syrup',
          dosage: '5mg/5ml',
          form: 'Syrup',
          frequency: 'Once daily',
          duration: '7 days',
          instructions: 'At bedtime',
          confidence: 0.88,
          requiresConfirmation: false,
        },
      ],
      overallConfidence: 0.91,
      rawText: ocrText,
    };

    return mockResult;
  }

  async explainMedication(context: MedicationExplanationContext): Promise<string> {
    return `Your prescription includes ${context.medicationName}${context.dosage ? ` (${context.dosage})` : ''}. ${context.frequency ? `You should take it ${context.frequency}` : ''}${context.instructions ? `, ${context.instructions}` : ''}. ${context.duration ? `This course is for ${context.duration}.` : ''} Always follow your doctor's instructions and consult them before making any changes.`;
  }
}

// ─────────────────────────────────────────────────────────────
// OpenAI LLM Provider
// ─────────────────────────────────────────────────────────────

class OpenAILLMProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private maxRetries: number;

  constructor(apiKey: string, model: string, maxRetries: number) {
    this.apiKey = apiKey;
    this.model = model;
    this.maxRetries = maxRetries;
  }

  async extractPrescription(ocrText: string): Promise<PrescriptionExtraction> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
              {
                role: 'user',
                content: `Parse the following prescription OCR text:\n\n${ocrText}`,
              },
            ],
            temperature: 0.1, // Low temperature for structured extraction
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
        };

        const content = data.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        const parsed = JSON.parse(content) as unknown;

        // Validate with Zod – never trust AI output
        const validated = prescriptionExtractionSchema.parse(parsed);
        return { ...validated, rawText: ocrText };
      } catch (err) {
        lastError = err as Error;
        logger.warn({ attempt, err }, 'LLM extraction attempt failed');

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // backoff
        }
      }
    }

    logger.error({ err: lastError }, 'All LLM extraction attempts failed');
    throw new AppError('AI_EXTRACTION_FAILED', 'Failed to extract prescription data. Please enter medications manually.', 422);
  }

  async explainMedication(context: MedicationExplanationContext): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Explain this medication in simple terms: ${JSON.stringify(context)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new AppError('AI_EXTRACTION_FAILED', 'Failed to generate explanation', 500);
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? 'Unable to generate explanation at this time.';
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createLLMProvider(): LLMProvider {
  switch (config.AI_PROVIDER) {
    case 'mock':
      return new MockLLMProvider();
    case 'openai':
      if (!config.AI_API_KEY) {
        logger.warn('AI_API_KEY not set, falling back to mock LLM');
        return new MockLLMProvider();
      }
      return new OpenAILLMProvider(config.AI_API_KEY, config.AI_MODEL, config.AI_MAX_RETRIES);
    default:
      logger.warn(`Unknown AI provider: ${config.AI_PROVIDER}, using mock`);
      return new MockLLMProvider();
  }
}

export const llmProvider = createLLMProvider();
