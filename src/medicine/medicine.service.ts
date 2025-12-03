import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';

@Injectable()
export class MedicineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIService,
  ) {}
  async search(country: string, medName: string): Promise<any[]> {
    if (country.toUpperCase() !== 'USA') {
      return []; // Currently only supports USA
    }

    if (!medName) {
      return [];
    }

    const medicines = await this.prisma.medicineUSA.findMany({
      where: {
        region: 'USA',
        PROPRIETARYNAME: {
          contains: medName,
          mode: 'insensitive',
        },
      },
      take: 50,
    });

    return medicines;
  }

  async getById(id: string) {
    if (!id) {
      return null;
    }

    let medicine = await this.prisma.medicineUSA.findUnique({
      where: { PRODUCTID: id },
    });

    if (!medicine) {
      return null;
    }

    // If AIMODELCHAT is missing, generate it with ChatGPT and save to DB
    if (!medicine.AIMODELCHAT) {
      try {
        console.log(
          `Generating AI suggestions for ${medicine.PROPRIETARYNAME}...`,
        );
        const aiSuggestions =
          await this.openai.generateMedicineSuggestions(medicine);

        // Save the AI-generated content back to the database
        medicine = await this.prisma.medicineUSA.update({
          where: { PRODUCTID: id },
          data: {
            AIMODELCHAT: aiSuggestions,
          },
        });

        console.log(`AI suggestions saved for ${medicine.PROPRIETARYNAME}`);
      } catch (error) {
        console.error('Failed to generate AI suggestions:', error);
        // Return medicine without AI suggestions if OpenAI call fails
      }
    }

    return medicine;
  }
}
