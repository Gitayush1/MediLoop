// ─────────────────────────────────────────────────────────────
// LLM Provider Abstraction
// ─────────────────────────────────────────────────────────────

import { config } from '../../../config';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../lib/errors';
import { prescriptionExtractionSchema } from '@mediloop/shared';
import type { PrescriptionExtraction } from '@mediloop/shared';

export interface LLMProvider {
  extractPrescription(ocrText: string, fileBuffer?: Buffer, mimeType?: string): Promise<PrescriptionExtraction>;
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
      doctorName: 'Dr. Rajesh Dental Clinic',
      patientName: 'Mr. Sachin Sansare',
      prescriptionDate: '2026-09-02',
      hospitalClinic: 'Care Dental & Medical Center',
      medicines: [
        {
          name: 'Augmentin',
          dosage: '625mg',
          form: 'Tablet',
          frequency: 'Twice daily (1-0-1)',
          duration: '5 days',
          instructions: 'After food',
          confidence: 0.95,
          requiresConfirmation: false,
        },
        {
          name: 'Enzoflam',
          dosage: undefined,
          form: 'Tablet',
          frequency: 'Twice daily (1-0-1)',
          duration: '5 days',
          instructions: 'After food',
          confidence: 0.92,
          requiresConfirmation: false,
        },
        {
          name: 'Pan D',
          dosage: '40mg',
          form: 'Tablet',
          frequency: 'Once daily (1-0-0)',
          duration: '5 days',
          instructions: 'Empty stomach in morning',
          confidence: 0.94,
          requiresConfirmation: false,
        },
        {
          name: 'Hexigel Gum Paint',
          dosage: undefined,
          form: 'Gel',
          frequency: 'Twice daily (1-0-1)',
          duration: '7 days',
          instructions: 'Massage gently on gums',
          confidence: 0.89,
          requiresConfirmation: false,
        },
      ],
      overallConfidence: 0.93,
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
// Gemini LLM Provider (Free tier available)
// ─────────────────────────────────────────────────────────────

class GeminiLLMProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private maxRetries: number;

  constructor(apiKey: string, model: string, maxRetries: number) {
    this.apiKey = apiKey;
    this.model = model;
    this.maxRetries = maxRetries;
  }

  async extractPrescription(
    ocrText: string,
    fileBuffer?: Buffer,
    mimeType?: string,
  ): Promise<PrescriptionExtraction> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Build the parts array — prefer vision if we have an image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [];

        if (fileBuffer && mimeType) {
          parts.push({
            inlineData: {
              mimeType,
              data: fileBuffer.toString('base64'),
            },
          });
          parts.push({
            text: `You are a medical prescription parsing assistant. Extract all medicines and details from this prescription image and return ONLY valid JSON (no markdown, no code blocks) matching this exact schema:
${EXTRACTION_SYSTEM_PROMPT}

If any text from OCR is also available, use it to verify:
${ocrText || '(no OCR text available)'}`,
          });
        } else {
          parts.push({
            text: `${EXTRACTION_SYSTEM_PROMPT}

Parse the following prescription OCR text and return ONLY valid JSON:

${ocrText}`,
          });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              },
            }),
          },
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = (await response.json()) as {
          candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
        };

        const content = data.candidates[0]?.content?.parts[0]?.text;
        if (!content) throw new Error('Empty response from Gemini');

        // Strip any accidental markdown fences
        const cleaned = content.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleaned) as unknown;

        const validated = prescriptionExtractionSchema.parse(parsed);
        return { ...validated, rawText: ocrText };
      } catch (err) {
        lastError = err as Error;
        logger.warn({ attempt, err }, 'Gemini extraction attempt failed');
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    logger.error({ err: lastError }, 'All Gemini extraction attempts failed');
    throw new AppError('AI_EXTRACTION_FAILED', 'Failed to extract prescription data. Please enter medications manually.', 422);
  }

  async explainMedication(context: MedicationExplanationContext): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${EXPLANATION_SYSTEM_PROMPT}

Explain this medication in simple terms: ${JSON.stringify(context)}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
        }),
      },
    );

    if (!response.ok) {
      throw new AppError('AI_EXTRACTION_FAILED', 'Failed to generate explanation', 500);
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates[0]?.content?.parts[0]?.text ?? 'Unable to generate explanation at this time.';
  }
}

// ─────────────────────────────────────────────────────────────
// Groq LLM Provider
// ─────────────────────────────────────────────────────────────

class GroqLLMProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private maxRetries: number;

  constructor(apiKey: string, model: string, maxRetries: number) {
    this.apiKey = apiKey;
    // Default to groq/compound
    this.model = model || 'groq/compound';
    this.maxRetries = maxRetries;
  }

  async extractPrescription(
    ocrText: string,
    fileBuffer?: Buffer,
    mimeType?: string,
  ): Promise<PrescriptionExtraction> {
    let lastError: Error | null = null;
    const targetModel = this.model || 'groq/compound';

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let userContent: any;

        if (fileBuffer && mimeType && (targetModel.includes('vision') || targetModel.includes('compound'))) {
          userContent = [
            {
              type: 'text',
              text: `Parse all medicines and details from this prescription image into structured JSON matching the schema.\nOCR Text if available:\n${ocrText || 'None'}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${fileBuffer.toString('base64')}`,
              },
            },
          ];
        } else {
          userContent = `Parse the following prescription OCR text:\n\n${ocrText}`;
        }

        const body: Record<string, unknown> = {
          model: targetModel,
          messages: [
            { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: userContent },
          ],
          temperature: 0.1,
        };

        // Groq supports JSON mode on text models like llama-3.3-70b-versatile
        if (!targetModel.includes('vision')) {
          body.response_format = { type: 'json_object' };
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Groq API error: ${response.status} - ${error}`);
        }

        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
        };

        const content = data.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from Groq');

        const cleaned = content.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleaned) as unknown;

        const validated = prescriptionExtractionSchema.parse(parsed);
        return { ...validated, rawText: ocrText };
      } catch (err) {
        lastError = err as Error;
        logger.warn({ attempt, err }, 'Groq LLM extraction attempt failed');
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    logger.error({ err: lastError }, 'All Groq LLM extraction attempts failed');
    throw new AppError('AI_EXTRACTION_FAILED', 'Failed to extract prescription data using Groq AI. Please enter medications manually.', 422);
  }

  async explainMedication(context: MedicationExplanationContext): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model || 'groq/compound',
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
      throw new AppError('AI_EXTRACTION_FAILED', 'Failed to generate explanation using Groq', 500);
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
    case 'gemini':
      if (!config.AI_API_KEY) {
        logger.warn('AI_API_KEY not set for Gemini, falling back to mock LLM');
        return new MockLLMProvider();
      }
      return new GeminiLLMProvider(config.AI_API_KEY, config.AI_MODEL, config.AI_MAX_RETRIES);
    case 'groq': {
      const groqKey = config.GROQ_API_KEY || config.AI_API_KEY;
      if (!groqKey) {
        logger.warn('GROQ_API_KEY or AI_API_KEY not set for Groq, falling back to mock LLM');
        return new MockLLMProvider();
      }
      return new GroqLLMProvider(groqKey, config.AI_MODEL, config.AI_MAX_RETRIES);
    }
    default:
      logger.warn(`Unknown AI provider: ${config.AI_PROVIDER}, using mock`);
      return new MockLLMProvider();
  }
}

export const llmProvider = createLLMProvider();

