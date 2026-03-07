import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateLaborRateDto, UpdateLaborRateDto } from './dto';

const SYSTEM_LABOR_RATES = [
  { name: 'Interior Door Installation', unit: 'ea', ratePerUnit: 85.00, hoursPerUnit: 1.5, hourlyRate: 55.00 },
  { name: 'Double Door Installation', unit: 'ea', ratePerUnit: 140.00, hoursPerUnit: 2.5, hourlyRate: 55.00 },
  { name: 'Exterior Door Installation', unit: 'ea', ratePerUnit: 180.00, hoursPerUnit: 3.0, hourlyRate: 60.00 },
  { name: 'Pocket Door Installation', unit: 'ea', ratePerUnit: 200.00, hoursPerUnit: 3.5, hourlyRate: 55.00 },
  { name: 'Bifold Door Installation', unit: 'ea', ratePerUnit: 65.00, hoursPerUnit: 1.0, hourlyRate: 55.00 },
  { name: 'Sliding Door Installation', unit: 'ea', ratePerUnit: 120.00, hoursPerUnit: 2.0, hourlyRate: 55.00 },
  { name: 'Base Trim Installation', unit: 'lf', ratePerUnit: 2.50, hoursPerUnit: 0.04, hourlyRate: 55.00 },
  { name: 'Crown Molding Installation', unit: 'lf', ratePerUnit: 4.50, hoursPerUnit: 0.08, hourlyRate: 55.00 },
  { name: 'Door Casing Installation', unit: 'lf', ratePerUnit: 2.00, hoursPerUnit: 0.035, hourlyRate: 55.00 },
  { name: 'Chair Rail Installation', unit: 'lf', ratePerUnit: 2.75, hoursPerUnit: 0.05, hourlyRate: 55.00 },
  { name: 'Shoe Molding Installation', unit: 'lf', ratePerUnit: 1.50, hoursPerUnit: 0.025, hourlyRate: 55.00 },
  { name: 'Window Casing Installation', unit: 'ea', ratePerUnit: 45.00, hoursPerUnit: 0.75, hourlyRate: 55.00 },
  { name: 'Window Sill Installation', unit: 'lf', ratePerUnit: 5.00, hoursPerUnit: 0.1, hourlyRate: 55.00 },
  { name: 'Closet Shelf Installation', unit: 'lf', ratePerUnit: 6.00, hoursPerUnit: 0.1, hourlyRate: 55.00 },
  { name: 'Closet Rod Installation', unit: 'lf', ratePerUnit: 4.00, hoursPerUnit: 0.07, hourlyRate: 55.00 },
  { name: 'Base Cabinet Installation', unit: 'ea', ratePerUnit: 95.00, hoursPerUnit: 1.5, hourlyRate: 60.00 },
  { name: 'Upper Cabinet Installation', unit: 'ea', ratePerUnit: 85.00, hoursPerUnit: 1.25, hourlyRate: 60.00 },
  { name: 'Tall Cabinet Installation', unit: 'ea', ratePerUnit: 120.00, hoursPerUnit: 2.0, hourlyRate: 60.00 },
  { name: 'Vanity Cabinet Installation', unit: 'ea', ratePerUnit: 100.00, hoursPerUnit: 1.5, hourlyRate: 60.00 },
  { name: 'Hardware Installation (per piece)', unit: 'ea', ratePerUnit: 5.00, hoursPerUnit: 0.08, hourlyRate: 55.00 },
];

@Injectable()
export class LaborRateService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.laborRate.count({ where: { isSystem: true } });
    if (count === 0) {
      for (const rate of SYSTEM_LABOR_RATES) {
        await this.prisma.laborRate.create({
          data: { ...rate, isSystem: true, isActive: true },
        });
      }
    }
  }

  async findAll(companyId?: string) {
    return this.prisma.laborRate.findMany({
      where: {
        OR: [
          { isSystem: true },
          ...(companyId ? [{ companyId }] : []),
        ],
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateLaborRateDto, companyId: string) {
    return this.prisma.laborRate.create({
      data: { ...data, companyId, isSystem: false },
    });
  }

  async update(id: string, data: UpdateLaborRateDto) {
    return this.prisma.laborRate.update({ where: { id }, data });
  }
}
