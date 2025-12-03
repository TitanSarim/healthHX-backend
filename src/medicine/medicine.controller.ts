import { Controller, Get, Param, Query } from '@nestjs/common';
import { MedicineService } from './medicine.service';

@Controller('medicine')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get('search')
  search(@Query('country') country: string, @Query('medName') medName: string) {
    return this.medicineService.search(country, medName);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.medicineService.getById(id);
  }
}
