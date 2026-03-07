import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LaborRateService } from './labor-rate.service';
import { CreateLaborRateDto, UpdateLaborRateDto } from './dto';

@Controller('labor-rates')
@UseGuards(AuthGuard('jwt'))
export class LaborRateController {
  constructor(private readonly laborRateService: LaborRateService) {}

  @Get()
  async findAll(@Request() req: any) {
    return { data: await this.laborRateService.findAll(req.user.companyId) };
  }

  @Post()
  async create(@Body() dto: CreateLaborRateDto, @Request() req: any) {
    return { data: await this.laborRateService.create(dto, req.user.companyId) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLaborRateDto) {
    return { data: await this.laborRateService.update(id, dto) };
  }
}
