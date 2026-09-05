// ─────────────────────────────────────────────────────────────
// OCR Provider Abstraction
// ─────────────────────────────────────────────────────────────

import { config } from '../../../config';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../lib/errors';

export interface OCRProvider {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<string>;
}

// ─────────────────────────────────────────────────────────────
// Mock OCR Provider (development / testing)
// ─────────────────────────────────────────────────────────────

class MockOCRProvider implements OCRProvider {
  async extractText(_fileBuffer: Buffer, _mimeType: string): Promise<string> {
    logger.debug('Using MockOCRProvider');
    return `
Dr. Priya Sharma
Specialization: General Medicine
Registration: MH-1234

Patient: John Doe
Date: 20/08/2026

Rx:
1. Tab Amoxicillin 500mg - 1 tab BD x 5 days (After food)
2. Tab Paracetamol 650mg - 1 tab TDS x 3 days (SOS)
3. Syrup Cetirizine 5mg/5ml - 1 tsp OD at bedtime x 7 days

Advice: Rest and drink plenty of fluids.
Follow-up: After 1 week.
    `.trim();
  }
}

// ─────────────────────────────────────────────────────────────
// Google Vision OCR Provider
// ─────────────────────────────────────────────────────────────

class GoogleVisionOCRProvider implements OCRProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractText(fileBuffer: Buffer, _mimeType: string): Promise<string> {
    const base64 = fileBuffer.toString('base64');

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error({ error }, 'Google Vision OCR failed');
      throw new AppError('OCR_FAILED', 'OCR extraction failed', 500);
    }

    const data = (await response.json()) as {
      responses: Array<{
        fullTextAnnotation?: { text: string };
        error?: { message: string };
      }>;
    };

    const result = data.responses[0];
    if (result?.error) {
      throw new AppError('OCR_FAILED', result.error.message, 500);
    }

    return result?.fullTextAnnotation?.text ?? '';
  }
}

// ─────────────────────────────────────────────────────────────
// Groq Vision OCR Provider
// ─────────────────────────────────────────────────────────────

class GroqOCRProvider implements OCRProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
    const base64 = fileBuffer.toString('base64');
    const model = config.AI_MODEL || 'groq/compound';

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Transcribe all visible text from this prescription image accurately into plain text. Include doctor details, patient details, medicine names, dosages, frequencies, and instructions. Output ONLY the transcribed text.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ error }, 'Groq Vision OCR failed');
        throw new AppError('OCR_FAILED', `Groq OCR failed: ${response.status}`, 500);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      return data.choices[0]?.message?.content?.trim() ?? '';
    } catch (err) {
      logger.error({ err }, 'Groq OCR extraction exception');
      throw err instanceof AppError ? err : new AppError('OCR_FAILED', 'Groq OCR extraction failed', 500);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createOCRProvider(): OCRProvider {
  switch (config.OCR_PROVIDER) {
    case 'mock':
      return new MockOCRProvider();
    case 'google-vision':
      if (!config.OCR_API_KEY) {
        logger.warn('OCR_API_KEY not set, falling back to mock');
        return new MockOCRProvider();
      }
      return new GoogleVisionOCRProvider(config.OCR_API_KEY);
    case 'groq': {
      const groqKey = config.GROQ_API_KEY || config.AI_API_KEY || config.OCR_API_KEY;
      if (!groqKey) {
        logger.warn('GROQ_API_KEY / AI_API_KEY not set, falling back to mock OCR');
        return new MockOCRProvider();
      }
      return new GroqOCRProvider(groqKey);
    }
    default:
      logger.warn(`Unknown OCR provider: ${config.OCR_PROVIDER}, using mock`);
      return new MockOCRProvider();
  }
}

export const ocrProvider = createOCRProvider();

