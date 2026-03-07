import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateTakeoffItemDto, UpdateTakeoffItemDto, BulkCreateTakeoffItemDto } from './dto';

@Injectable()
export class TakeoffItemService {
  constructor(private prisma: PrismaService) {}

  private async verifyProjectAccess(projectId: string, companyId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.companyId !== companyId) throw new ForbiddenException('Access denied');
  }

  async findByProject(projectId: string, companyId: string, filters?: {
    categoryId?: string;
    sheetId?: string;
    roomId?: string;
    source?: string;
    verified?: boolean;
  }) {
    await this.verifyProjectAccess(projectId, companyId);

    const where: any = { projectId, deletedAt: null };
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.sheetId) where.sheetId = filters.sheetId;
    if (filters?.roomId) where.roomId = filters.roomId;
    if (filters?.source) where.source = filters.source;
    if (filters?.verified !== undefined) where.verified = filters.verified;

    return this.prisma.takeoffItem.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
    });
  }

  async findBySheet(sheetId: string, companyId: string) {
    // Verify access through sheet -> blueprint -> project -> company
    const sheet = await this.prisma.sheet.findUnique({
      where: { id: sheetId },
      include: { blueprint: { include: { project: { select: { id: true, companyId: true } } } } },
    });
    if (!sheet) throw new NotFoundException('Sheet not found');
    if (sheet.blueprint.project.companyId !== companyId) throw new ForbiddenException('Access denied');

    return this.prisma.takeoffItem.findMany({
      where: { sheetId, deletedAt: null },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
    });
  }

  async create(projectId: string, userId: string, companyId: string, dto: CreateTakeoffItemDto) {
    await this.verifyProjectAccess(projectId, companyId);

    return this.prisma.takeoffItem.create({
      data: {
        projectId,
        categoryId: dto.categoryId,
        sheetId: dto.sheetId,
        roomId: dto.roomId,
        createdById: userId,
        source: (dto.source as any) || 'MANUAL',
        label: dto.label,
        description: dto.description,
        quantity: dto.quantity || 1,
        unit: dto.unit || 'ea',
        length: dto.length,
        width: dto.width,
        area: dto.area,
        coordinates: dto.coordinates,
        confidence: dto.confidence,
        notes: dto.notes,
      },
      include: { category: true },
    });
  }

  async bulkCreate(projectId: string, userId: string, companyId: string, dto: BulkCreateTakeoffItemDto) {
    await this.verifyProjectAccess(projectId, companyId);

    const items = await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.takeoffItem.create({
          data: {
            projectId,
            categoryId: item.categoryId,
            sheetId: item.sheetId,
            roomId: item.roomId,
            createdById: userId,
            source: (item.source as any) || 'MANUAL',
            label: item.label,
            description: item.description,
            quantity: item.quantity || 1,
            unit: item.unit || 'ea',
            length: item.length,
            width: item.width,
            area: item.area,
            coordinates: item.coordinates,
            confidence: item.confidence,
            notes: item.notes,
          },
          include: { category: true },
        }),
      ),
    );
    return items;
  }

  async update(id: string, companyId: string, dto: UpdateTakeoffItemDto) {
    const item = await this.prisma.takeoffItem.findUnique({
      where: { id },
      include: { project: { select: { companyId: true } } },
    });
    if (!item) throw new NotFoundException('Takeoff item not found');
    if (item.project.companyId !== companyId) throw new ForbiddenException('Access denied');

    return this.prisma.takeoffItem.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        roomId: dto.roomId,
        label: dto.label,
        description: dto.description,
        quantity: dto.quantity,
        length: dto.length,
        width: dto.width,
        area: dto.area,
        coordinates: dto.coordinates,
        verified: dto.verified,
        notes: dto.notes,
      },
      include: { category: true },
    });
  }

  async remove(id: string, companyId: string) {
    const item = await this.prisma.takeoffItem.findUnique({
      where: { id },
      include: { project: { select: { companyId: true } } },
    });
    if (!item) throw new NotFoundException('Takeoff item not found');
    if (item.project.companyId !== companyId) throw new ForbiddenException('Access denied');

    // Soft delete
    return this.prisma.takeoffItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getSummary(projectId: string, companyId: string) {
    await this.verifyProjectAccess(projectId, companyId);

    const items = await this.prisma.takeoffItem.findMany({
      where: { projectId, deletedAt: null },
      include: { category: true },
    });

    // Aggregate by category
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      categoryCode: string;
      color: string;
      measureType: string;
      unit: string;
      totalCount: number;
      totalQuantity: number;
      totalLF: number;
      totalSF: number;
      verified: number;
      unverified: number;
    }>();

    for (const item of items) {
      const key = item.categoryId;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoryId: item.categoryId,
          categoryName: item.category.name,
          categoryCode: item.category.code,
          color: item.category.color,
          measureType: item.category.measureType,
          unit: item.category.unit,
          totalCount: 0,
          totalQuantity: 0,
          totalLF: 0,
          totalSF: 0,
          verified: 0,
          unverified: 0,
        });
      }
      const agg = categoryMap.get(key)!;
      agg.totalCount += 1;
      agg.totalQuantity += item.quantity;
      if (item.length) agg.totalLF += item.length * item.quantity;
      if (item.area) agg.totalSF += item.area * item.quantity;
      if (item.verified) agg.verified += 1;
      else agg.unverified += 1;
    }

    return {
      totalItems: items.length,
      totalVerified: items.filter((i) => i.verified).length,
      categories: Array.from(categoryMap.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName)),
    };
  }
}
