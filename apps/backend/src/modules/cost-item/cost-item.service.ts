import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateCostItemDto, UpdateCostItemDto } from './dto';

const SYSTEM_COST_ITEMS = [
  // Doors
  { name: 'Interior Hollow Core Door Slab', unit: 'ea', unitCost: 45.00, categoryCode: 'INT_SINGLE_DOOR' },
  { name: 'Interior Solid Core Door Slab', unit: 'ea', unitCost: 120.00, categoryCode: 'INT_SINGLE_DOOR' },
  { name: 'Door Hinges (3-pack)', unit: 'set', unitCost: 12.00, categoryCode: 'INT_SINGLE_DOOR' },
  { name: 'Door Knob/Lever Set', unit: 'ea', unitCost: 28.00, categoryCode: 'DOOR_HARDWARE' },
  { name: 'Deadbolt Lock', unit: 'ea', unitCost: 35.00, categoryCode: 'DOOR_HARDWARE' },
  { name: 'Prehung Interior Door', unit: 'ea', unitCost: 180.00, categoryCode: 'INT_SINGLE_DOOR' },
  { name: 'Prehung Double Door', unit: 'ea', unitCost: 380.00, categoryCode: 'INT_DOUBLE_DOOR' },
  { name: 'Bifold Door Set', unit: 'ea', unitCost: 85.00, categoryCode: 'BIFOLD_DOOR' },
  { name: 'Pocket Door Frame Kit', unit: 'ea', unitCost: 150.00, categoryCode: 'POCKET_DOOR' },
  { name: 'Sliding Door Hardware Kit', unit: 'ea', unitCost: 95.00, categoryCode: 'SLIDING_DOOR' },
  // Trim
  { name: 'Base Trim - MDF 3.25"', unit: 'lf', unitCost: 1.20, categoryCode: 'BASE_TRIM' },
  { name: 'Base Trim - Pine 3.25"', unit: 'lf', unitCost: 1.85, categoryCode: 'BASE_TRIM' },
  { name: 'Crown Molding - MDF 3.5"', unit: 'lf', unitCost: 2.10, categoryCode: 'CROWN_MOLDING' },
  { name: 'Crown Molding - Pine 4.5"', unit: 'lf', unitCost: 3.50, categoryCode: 'CROWN_MOLDING' },
  { name: 'Door Casing - MDF 2.25"', unit: 'lf', unitCost: 0.95, categoryCode: 'CASING_TRIM' },
  { name: 'Chair Rail - MDF', unit: 'lf', unitCost: 1.50, categoryCode: 'CHAIR_RAIL' },
  { name: 'Shoe Molding', unit: 'lf', unitCost: 0.65, categoryCode: 'SHOE_MOLDING' },
  // Windows
  { name: 'Window Casing Kit', unit: 'ea', unitCost: 25.00, categoryCode: 'WINDOW_CASING' },
  { name: 'Window Sill - MDF', unit: 'lf', unitCost: 3.50, categoryCode: 'WINDOW_SILL' },
  // Closets
  { name: 'Closet Shelf - Melamine 12"', unit: 'lf', unitCost: 4.50, categoryCode: 'CLOSET_SHELF' },
  { name: 'Closet Rod - Chrome', unit: 'lf', unitCost: 2.80, categoryCode: 'CLOSET_ROD' },
  { name: 'Closet Rod Brackets (pair)', unit: 'set', unitCost: 6.00, categoryCode: 'CLOSET_ROD' },
  // Cabinets
  { name: 'Base Cabinet 36"', unit: 'ea', unitCost: 280.00, categoryCode: 'BASE_CABINET' },
  { name: 'Upper Cabinet 30"', unit: 'ea', unitCost: 220.00, categoryCode: 'UPPER_CABINET' },
  { name: 'Tall Pantry Cabinet 84"', unit: 'ea', unitCost: 450.00, categoryCode: 'TALL_CABINET' },
  { name: 'Vanity Cabinet 36"', unit: 'ea', unitCost: 320.00, categoryCode: 'VANITY_CABINET' },
  // Hardware
  { name: 'Cabinet Knob', unit: 'ea', unitCost: 4.50, categoryCode: 'CABINET_HARDWARE' },
  { name: 'Cabinet Pull 5"', unit: 'ea', unitCost: 6.00, categoryCode: 'CABINET_HARDWARE' },
  // Misc
  { name: 'Finish Nails (1lb box)', unit: 'ea', unitCost: 8.50, categoryCode: null },
  { name: 'Wood Glue 16oz', unit: 'ea', unitCost: 7.00, categoryCode: null },
  { name: 'Caulk Tube', unit: 'ea', unitCost: 5.50, categoryCode: null },
];

@Injectable()
export class CostItemService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.costItem.count({ where: { isSystem: true } });
    if (count === 0) {
      for (const item of SYSTEM_COST_ITEMS) {
        await this.prisma.costItem.create({
          data: {
            name: item.name,
            unit: item.unit,
            unitCost: item.unitCost,
            isSystem: true,
            isActive: true,
          },
        });
      }
    }
  }

  async findAll(companyId?: string) {
    return this.prisma.costItem.findMany({
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

  async create(data: CreateCostItemDto, companyId: string) {
    return this.prisma.costItem.create({
      data: {
        ...data,
        companyId,
        isSystem: false,
      },
    });
  }

  async update(id: string, data: UpdateCostItemDto) {
    return this.prisma.costItem.update({
      where: { id },
      data,
    });
  }
}
