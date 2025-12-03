import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MedicineModule } from './medicine/medicine.module';
import { PrismaModule } from './prisma/prisma.module';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [PrismaModule, OpenAIModule, MedicineModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
