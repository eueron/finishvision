import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTakeoffCategoryDto, UpdateTakeoffCategoryDto } from './dto';

const SYSTEM_CATEGORIES = [
  // Doors
  { name: 'Interior Single Door', code: 'INT_SINGLE_DOOR', color: '#F59E0B', measureType: 'COUNT', unit: 'ea', sortOrder: 1 },
  { name: 'Interior Double Door', code: 'INT_DOUBLE_DOOR', color: '#F59E0B', measureType: 'COUNT', unit: 'ea', sortOrder: 2 },
  { name: 'Exterior Door', code: 'EXT_DOOR', color: '#D97706', measureType: 'COUNT', unit: 'ea', sortOrder: 3 },
  { name: 'Sliding Door', code: 'SLIDING_DOOR', color: '#B45309', measureType: 'COUNT', unit: 'ea', sortOrder: 4 },
  { name: 'Pocket Door', code: 'POCKET_DOOR', color: '#92400E', measureType: 'COUNT', unit: 'ea', sortOrder: 5 },
  { name: 'Bi-fold Door', code: 'BIFOLD_DOOR', color: '#78350F', measureType: 'COUNT', unit: 'ea', sortOrder: 6 },
  // Windows
  { name: 'Window', code: 'WINDOW', color: '#06B6D4', measureType: 'COUNT', unit: 'ea', sortOrder: 10 },
  { name: 'Window Casing', code: 'WINDOW_CASING', color: '#0891B2', measureType: 'LINEAR', unit: 'lf', sortOrder: 11 },
  { name: 'Window Sill', code: 'WINDOW_SILL', color: '#0E7490', measureType: 'LINEAR', unit: 'lf', sortOrder: 12 },
  // Trim
  { name: 'Base Trim', code: 'BASE_TRIM', color: '#8B5CF6', measureType: 'LINEAR', unit: 'lf', sortOrder: 20 },
  { name: 'Crown Molding', code: 'CROWN_MOLDING', color: '#7C3AED', measureType: 'LINEAR', unit: 'lf', sortOrder: 21 },
  { name: 'Chair Rail', code: 'CHAIR_RAIL', color: '#6D28D9', measureType: 'LINEAR', unit: 'lf', sortOrder: 22 },
  { name: 'Casing Trim', code: 'CASING_TRIM', color: '#5B21B6', measureType: 'LINEAR', unit: 'lf', sortOrder: 23 },
  { name: 'Shoe Molding', code: 'SHOE_MOLDING', color: '#4C1D95', measureType: 'LINEAR', unit: 'lf', sortOrder: 24 },
  // Closets
  { name: 'Closet Shelf', code: 'CLOSET_SHELF', color: '#10B981', measureType: 'LINEAR', unit: 'lf', sortOrder: 30 },
  { name: 'Closet Rod', code: 'CLOSET_ROD', color: '#059669', measureType: 'LINEAR', unit: 'lf', sortOrder: 31 },
  { name: 'Closet System', code: 'CLOSET_SYSTEM', color: '#047857', measureType: 'COUNT', unit: 'ea', sortOrder: 32 },
  // Cabinets
  { name: 'Base Cabinet', code: 'BASE_CABINET', color: '#EF4444', measureType: 'LINEAR', unit: 'lf', sortOrder: 40 },
  { name: 'Upper Cabinet', code: 'UPPER_CABINET', color: '#DC2626', measureType: 'LINEAR', unit: 'lf', sortOrder: 41 },
  { name: 'Tall Cabinet', code: 'TALL_CABINET', color: '#B91C1C', measureType: 'COUNT', unit: 'ea', sortOrder: 42 },
  { name: 'Vanity Cabinet', code: 'VANITY_CABINET', color: '#991B1B', measureType: 'LINEAR', unit: 'lf', sortOrder: 43 },
  // Hardware
  { name: 'Door Hardware', code: 'DOOR_HARDWARE', color: '#64748B', measureType: 'COUNT', unit: 'ea', sortOrder: 50 },
  { name: 'Cabinet Hardware', code: 'CABINET_HARDWARE', color: '#475569', measureType: 'COUNT', unit: 'ea', sortOrder: 51 },
  // Other
  { name: 'Stair Parts', code: 'STAIR_PARTS', color: '#EA580C', measureType: 'COUNT', unit: 'ea', sortOrder: 60 },
  { name: 'Wainscoting', code: 'WAINSCOTING', color: '#C2410C', measureType: 'AREA', unit: 'sf', sortOrder: 61 },
];

@Injectable()
export class TakeoffCategoryService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Seed system categories if they don't exist
    const existing = await this.prisma.takeoffCategory.count({ where: { isSystem: true } });
    if (existing === 0) {
      for (const cat of SYSTEM_CATEGORIES) {
        await this.prisma.takeoffCategory.create({
          data: { ...cat, isSystem: true, companyId: null } as any,
        });
      }
    }
  }

  async findAll(companyId: string) {
    return this.prisma.takeoffCategory.findMany({
      where: {
        OR: [
          { isSystem: true },
          { companyId },
        ],
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(companyId: string, dto: CreateTakeoffCategoryDto) {
    return this.prisma.takeoffCategory.create({
      data: {
        companyId,
        name: dto.name,
        code: dto.code,
        color: dto.color,
        icon: dto.icon,
        measureType: dto.measureType as any || 'COUNT',
        unit: dto.unit || 'ea',
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async update(id: string, companyId: string, dto: UpdateTakeoffCategoryDto) {
    const cat = await this.prisma.takeoffCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    // Can only edit company-owned categories
    if (cat.isSystem && cat.companyId !== companyId) {
      // For system categories, allow toggling active only
      return this.prisma.takeoffCategory.update({
        where: { id },
        data: { isActive: dto.isActive },
      });
    }
    return this.prisma.takeoffCategory.update({
      where: { id },
      data: {
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        unit: dto.unit,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
  }
}
