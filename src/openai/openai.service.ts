import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { MedicineUSA } from '@prisma/client';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPEN_API_KEY;

    if (!apiKey) {
      throw new Error('OPEN_API_KEY is not set in .env');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  async generateMedicineSuggestions(medicine: MedicineUSA): Promise<string> {
    try {
      const prompt = `You are a medical information assistant. Provide helpful, concise information about the following medicine:

Medicine Name: ${medicine.PROPRIETARYNAME ?? ''}
Generic Name: ${medicine.NONPROPRIETARYNAME ?? ''}
Dosage Form: ${medicine.DOSAGEFORMNAME ?? ''}
Route: ${medicine.ROUTENAME ?? ''}
Strength: ${medicine.ACTIVE_NUMERATOR_STRENGTH} ${medicine.ACTIVE_INGRED_UNIT ?? ''}
Manufacturer: ${medicine.LABELERNAME ?? ''}
Pharmacological Classes: ${medicine.PHARM_CLASSES ?? ''}

Please provide:
1. A brief description of what this medicine is used for
2. Common side effects (if applicable)
3. Important warnings or precautions
4. General usage instructions

Keep the response under 300 words and use clear, simple language.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful medical information assistant. Provide accurate, concise information about medications.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return (
        completion.choices[0]?.message?.content || 'No suggestions available.'
      );
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to generate medicine suggestions');
    }
  }
}
