import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AssemblyService } from '../assembly/assembly.service';
import {
  CreateEstimateDto,
  UpdateEstimateDto,
  AddEstimateLineDto,
  UpdateEstimateLineDto,
  GenerateEstimateDto,
} from './dto';

@Injectable()
export class EstimateService {
  constructor(
    private prisma: PrismaService,
    private assemblyService: AssemblyService,
  ) {}

  async findByProject(projectId: string) {
    return this.prisma.estimate.findMany({
      where: { projectId, deletedAt: null },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id },
      include: {
        lines: {
          orderBy: { sortOrder: 'asc' },
          include: { assembly: true },
        },
        project: true,
      },
    });
    if (!estimate) throw new NotFoundException('Estimate not found');
    return estimate;
  }

  async create(projectId: string, companyId: string, userId: string, dto: CreateEstimateDto) {
    return this.prisma.estimate.create({
      data: {
        projectId,
        companyId,
        createdById: userId,
        name: dto.name,
        markupPercent: dto.markupPercent || 0,
        taxPercent: dto.taxPercent || 0,
        notes: dto.notes,
      },
      include: { lines: true },
    });
  }

  async update(id: string, dto: UpdateEstimateDto) {
    const estimate = await this.prisma.estimate.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as any,
      },
    });
    // Recalculate totals if markup or tax changed
    if (dto.markupPercent !== undefined || dto.taxPercent !== undefined) {
      return this.recalculateTotals(id);
    }
    return estimate;
  }

  async delete(id: string) {
    return this.prisma.estimate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // --- Line Items ---

  async addLine(estimateId: string, dto: AddEstimateLineDto) {
    const totalCost = dto.materialCost + dto.laborCost;
    const maxSort = await this.prisma.estimateLine.aggregate({
      where: { estimateId },
      _max: { sortOrder: true },
    });

    const line = await this.prisma.estimateLine.create({
      data: {
        estimateId,
        assemblyId: dto.assemblyId,
        takeoffItemId: dto.takeoffItemId,
        categoryCode: dto.categoryCode,
        description: dto.description,
        unit: dto.unit || 'ea',
        quantity: dto.quantity,
        materialCost: dto.materialCost,
        laborCost: dto.laborCost,
        totalCost,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
        notes: dto.notes,
      },
    });

    await this.recalculateTotals(estimateId);
    return line;
  }

  async updateLine(lineId: string, dto: UpdateEstimateLineDto) {
    const existing = await this.prisma.estimateLine.findUnique({ where: { id: lineId } });
    if (!existing) throw new NotFoundException('Estimate line not found');

    const materialCost = dto.materialCost ?? Number(existing.materialCost);
    const laborCost = dto.laborCost ?? Number(existing.laborCost);
    const totalCost = materialCost + laborCost;

    const line = await this.prisma.estimateLine.update({
      where: { id: lineId },
      data: { ...dto, materialCost, laborCost, totalCost },
    });

    await this.recalculateTotals(existing.estimateId);
    return line;
  }

  async deleteLine(lineId: string) {
    const line = await this.prisma.estimateLine.findUnique({ where: { id: lineId } });
    if (!line) throw new NotFoundException('Estimate line not found');
    await this.prisma.estimateLine.delete({ where: { id: lineId } });
    await this.recalculateTotals(line.estimateId);
    return line;
  }

  // --- Auto-generate from takeoff ---

  async generateFromTakeoff(projectId: string, companyId: string, userId: string, dto: GenerateEstimateDto) {
    // 1. Get all takeoff items for this project
    const takeoffItems = await this.prisma.takeoffItem.findMany({
      where: { projectId, deletedAt: null },
      include: { category: true },
    });

    if (takeoffItems.length === 0) {
      throw new NotFoundException('No takeoff items found for this project');
    }

    // 2. Get all assemblies
    const assemblies = await this.assemblyService.findAll(companyId);

    // 3. Build a map: categoryCode -> assembly
    const assemblyByName = new Map<string, any>();
    for (const asm of assemblies) {
      // Match by name pattern
      assemblyByName.set(asm.name, asm);
    }

    // 4. Aggregate takeoff items by category
    const categoryAgg = new Map<string, { category: any; totalQty: number; totalLF: number; totalSF: number; items: any[] }>();
    for (const item of takeoffItems) {
      const key = item.categoryId;
      if (!categoryAgg.has(key)) {
        categoryAgg.set(key, { category: item.category, totalQty: 0, totalLF: 0, totalSF: 0, items: [] });
      }
      const agg = categoryAgg.get(key)!;
      agg.totalQty += item.quantity;
      agg.totalLF += item.length ? item.length / 12 : 0; // convert inches to feet
      agg.totalSF += item.area ? item.area / 144 : 0; // convert sq inches to sq feet
      agg.items.push(item);
    }

    // 5. Create estimate
    const estimate = await this.prisma.estimate.create({
      data: {
        projectId,
        companyId,
        createdById: userId,
        name: dto.name,
        markupPercent: dto.markupPercent || 0,
        taxPercent: dto.taxPercent || 0,
        notes: dto.notes,
      },
    });

    // 6. Generate lines from takeoff aggregation
    let sortOrder = 0;
    const lines: any[] = [];

    for (const [, agg] of categoryAgg) {
      const cat = agg.category;
      // Find matching assembly
      const matchingAssembly = assemblies.find((a: any) => {
        if (a.categoryId === cat.id) return true;
        // Fuzzy match by category code in assembly name
        const catName = cat.name.toLowerCase();
        const asmName = a.name.toLowerCase();
        return asmName.includes(catName.split(' ')[0].toLowerCase());
      });

      let materialCost = 0;
      let laborCost = 0;
      let quantity = agg.totalQty;
      let unit = cat.unit || 'ea';
      let description = cat.name;

      if (cat.measureType === 'LINEAR') {
        quantity = Math.ceil(agg.totalLF) || agg.totalQty;
        unit = 'lf';
      } else if (cat.measureType === 'AREA') {
        quantity = Math.ceil(agg.totalSF) || agg.totalQty;
        unit = 'sf';
      }

      if (matchingAssembly) {
        const costs = this.assemblyService.calcAssemblyCost(matchingAssembly, quantity);
        materialCost = costs.materialTotal;
        laborCost = costs.laborTotal;
        description = `${cat.name} (${matchingAssembly.name})`;
      } else {
        // Default fallback costs per category type
        if (cat.measureType === 'COUNT') {
          materialCost = quantity * 50; // default $50/ea material
          laborCost = quantity * 40; // default $40/ea labor
        } else if (cat.measureType === 'LINEAR') {
          materialCost = quantity * 2.0; // default $2/lf material
          laborCost = quantity * 3.0; // default $3/lf labor
        } else {
          materialCost = quantity * 1.5; // default $1.50/sf material
          laborCost = quantity * 2.0; // default $2/sf labor
        }
      }

      sortOrder++;
      lines.push({
        estimateId: estimate.id,
        assemblyId: matchingAssembly?.id || null,
        categoryCode: cat.code,
        description,
        unit,
        quantity,
        materialCost: Math.round(materialCost * 100) / 100,
        laborCost: Math.round(laborCost * 100) / 100,
        totalCost: Math.round((materialCost + laborCost) * 100) / 100,
        sortOrder,
      });
    }

    // 7. Bulk create lines
    if (lines.length > 0) {
      await this.prisma.estimateLine.createMany({ data: lines });
    }

    // 8. Recalculate totals
    await this.recalculateTotals(estimate.id);

    return this.findOne(estimate.id);
  }

  // --- Recalculate ---

  private async recalculateTotals(estimateId: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { lines: true },
    });
    if (!estimate) return;

    const subtotal = estimate.lines.reduce((sum, l) => sum + Number(l.totalCost), 0);
    const markupAmount = subtotal * (Number(estimate.markupPercent) / 100);
    const afterMarkup = subtotal + markupAmount;
    const taxAmount = afterMarkup * (Number(estimate.taxPercent) / 100);
    const totalAmount = afterMarkup + taxAmount;

    return this.prisma.estimate.update({
      where: { id: estimateId },
      data: {
        subtotal: Math.round(subtotal * 100) / 100,
        markupAmount: Math.round(markupAmount * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
  }
}
