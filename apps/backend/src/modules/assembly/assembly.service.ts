import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto';

// System assemblies seeded on first run
const SYSTEM_ASSEMBLIES = [
  {
    name: 'Interior Door - Complete Install',
    unit: 'ea',
    categoryCode: 'INT_SINGLE_DOOR',
    items: [
      { type: 'MATERIAL', name: 'Prehung Interior Door', unit: 'ea', quantity: 1, unitCost: 180.00 },
      { type: 'MATERIAL', name: 'Door Hinges (3-pack)', unit: 'set', quantity: 1, unitCost: 12.00 },
      { type: 'MATERIAL', name: 'Door Knob/Lever Set', unit: 'ea', quantity: 1, unitCost: 28.00 },
      { type: 'MATERIAL', name: 'Door Casing - MDF', unit: 'lf', quantity: 17, unitCost: 0.95 },
      { type: 'LABOR', name: 'Door Installation', unit: 'ea', quantity: 1, unitCost: 85.00 },
      { type: 'LABOR', name: 'Casing Installation', unit: 'lf', quantity: 17, unitCost: 2.00 },
    ],
  },
  {
    name: 'Double Door - Complete Install',
    unit: 'ea',
    categoryCode: 'INT_DOUBLE_DOOR',
    items: [
      { type: 'MATERIAL', name: 'Prehung Double Door', unit: 'ea', quantity: 1, unitCost: 380.00 },
      { type: 'MATERIAL', name: 'Door Hinges (3-pack)', unit: 'set', quantity: 2, unitCost: 12.00 },
      { type: 'MATERIAL', name: 'Door Knob/Lever Set', unit: 'ea', quantity: 2, unitCost: 28.00 },
      { type: 'MATERIAL', name: 'Door Casing - MDF', unit: 'lf', quantity: 21, unitCost: 0.95 },
      { type: 'LABOR', name: 'Double Door Installation', unit: 'ea', quantity: 1, unitCost: 140.00 },
      { type: 'LABOR', name: 'Casing Installation', unit: 'lf', quantity: 21, unitCost: 2.00 },
    ],
  },
  {
    name: 'Bifold Door - Complete Install',
    unit: 'ea',
    categoryCode: 'BIFOLD_DOOR',
    items: [
      { type: 'MATERIAL', name: 'Bifold Door Set', unit: 'ea', quantity: 1, unitCost: 85.00 },
      { type: 'MATERIAL', name: 'Door Casing - MDF', unit: 'lf', quantity: 15, unitCost: 0.95 },
      { type: 'LABOR', name: 'Bifold Door Installation', unit: 'ea', quantity: 1, unitCost: 65.00 },
      { type: 'LABOR', name: 'Casing Installation', unit: 'lf', quantity: 15, unitCost: 2.00 },
    ],
  },
  {
    name: 'Base Trim - Per Linear Foot',
    unit: 'lf',
    categoryCode: 'BASE_TRIM',
    items: [
      { type: 'MATERIAL', name: 'Base Trim - MDF 3.25"', unit: 'lf', quantity: 1, unitCost: 1.20 },
      { type: 'LABOR', name: 'Base Trim Installation', unit: 'lf', quantity: 1, unitCost: 2.50 },
    ],
  },
  {
    name: 'Crown Molding - Per Linear Foot',
    unit: 'lf',
    categoryCode: 'CROWN_MOLDING',
    items: [
      { type: 'MATERIAL', name: 'Crown Molding - MDF 3.5"', unit: 'lf', quantity: 1, unitCost: 2.10 },
      { type: 'LABOR', name: 'Crown Molding Installation', unit: 'lf', quantity: 1, unitCost: 4.50 },
    ],
  },
  {
    name: 'Window Casing - Complete',
    unit: 'ea',
    categoryCode: 'WINDOW_CASING',
    items: [
      { type: 'MATERIAL', name: 'Window Casing Kit', unit: 'ea', quantity: 1, unitCost: 25.00 },
      { type: 'MATERIAL', name: 'Window Sill - MDF', unit: 'lf', quantity: 3, unitCost: 3.50 },
      { type: 'LABOR', name: 'Window Casing Installation', unit: 'ea', quantity: 1, unitCost: 45.00 },
    ],
  },
  {
    name: 'Closet Shelf & Rod',
    unit: 'lf',
    categoryCode: 'CLOSET_SHELF',
    items: [
      { type: 'MATERIAL', name: 'Closet Shelf - Melamine 12"', unit: 'lf', quantity: 1, unitCost: 4.50 },
      { type: 'MATERIAL', name: 'Closet Rod - Chrome', unit: 'lf', quantity: 1, unitCost: 2.80 },
      { type: 'LABOR', name: 'Closet Shelf Installation', unit: 'lf', quantity: 1, unitCost: 6.00 },
      { type: 'LABOR', name: 'Closet Rod Installation', unit: 'lf', quantity: 1, unitCost: 4.00 },
    ],
  },
  {
    name: 'Base Cabinet - Installed',
    unit: 'ea',
    categoryCode: 'BASE_CABINET',
    items: [
      { type: 'MATERIAL', name: 'Base Cabinet 36"', unit: 'ea', quantity: 1, unitCost: 280.00 },
      { type: 'MATERIAL', name: 'Cabinet Knob', unit: 'ea', quantity: 2, unitCost: 4.50 },
      { type: 'LABOR', name: 'Base Cabinet Installation', unit: 'ea', quantity: 1, unitCost: 95.00 },
    ],
  },
  {
    name: 'Upper Cabinet - Installed',
    unit: 'ea',
    categoryCode: 'UPPER_CABINET',
    items: [
      { type: 'MATERIAL', name: 'Upper Cabinet 30"', unit: 'ea', quantity: 1, unitCost: 220.00 },
      { type: 'MATERIAL', name: 'Cabinet Knob', unit: 'ea', quantity: 2, unitCost: 4.50 },
      { type: 'LABOR', name: 'Upper Cabinet Installation', unit: 'ea', quantity: 1, unitCost: 85.00 },
    ],
  },
];

@Injectable()
export class AssemblyService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.assembly.count({ where: { isSystem: true } });
    if (count === 0) {
      for (const asm of SYSTEM_ASSEMBLIES) {
        await this.prisma.assembly.create({
          data: {
            name: asm.name,
            unit: asm.unit,
            isSystem: true,
            isActive: true,
            items: {
              create: asm.items.map((item, idx) => ({
                type: item.type as any,
                name: item.name,
                unit: item.unit,
                quantity: item.quantity,
                unitCost: item.unitCost,
                sortOrder: idx,
              })),
            },
          },
        });
      }
    }
  }

  async findAll(companyId?: string) {
    return this.prisma.assembly.findMany({
      where: {
        OR: [
          { isSystem: true },
          ...(companyId ? [{ companyId }] : []),
        ],
        isActive: true,
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.assembly.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async create(data: CreateAssemblyDto, companyId: string) {
    const { items, ...assemblyData } = data;
    return this.prisma.assembly.create({
      data: {
        ...assemblyData,
        companyId,
        isSystem: false,
        items: items
          ? {
              create: items.map((item, idx) => ({
                type: item.type as any,
                costItemId: item.costItemId,
                laborRateId: item.laborRateId,
                name: item.name,
                unit: item.unit || 'ea',
                quantity: item.quantity,
                unitCost: item.unitCost,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  async update(id: string, data: UpdateAssemblyDto) {
    return this.prisma.assembly.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  /** Calculate total cost for an assembly given a quantity */
  calcAssemblyCost(assembly: any, quantity: number) {
    let materialTotal = 0;
    let laborTotal = 0;
    for (const item of assembly.items || []) {
      const lineCost = Number(item.quantity) * Number(item.unitCost) * quantity;
      if (item.type === 'MATERIAL') materialTotal += lineCost;
      else laborTotal += lineCost;
    }
    return { materialTotal, laborTotal, total: materialTotal + laborTotal };
  }
}
