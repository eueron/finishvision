import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { GenerateReportDto } from './dto';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  async findByProject(projectId: string) {
    return this.prisma.report.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async generate(
    projectId: string,
    companyId: string,
    userId: string,
    dto: GenerateReportDto,
  ) {
    // Load project and company
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let buffer: Buffer;
    let reportName: string;
    let contentType: string;
    let extension: string;

    if (dto.type === 'TAKEOFF_SUMMARY') {
      const result = await this.generateTakeoffReport(project, company, dateStr, dto.format || 'PDF');
      buffer = result.buffer;
      reportName = dto.name || `Takeoff Summary - ${project.name}`;
      contentType = result.contentType;
      extension = result.extension;
    } else if (dto.type === 'ESTIMATE_SUMMARY') {
      if (!dto.estimateId) throw new BadRequestException('estimateId is required for estimate reports');
      const result = await this.generateEstimateReport(dto.estimateId, project, company, dateStr, dto.format || 'PDF');
      buffer = result.buffer;
      reportName = dto.name || `Estimate Summary - ${project.name}`;
      contentType = result.contentType;
      extension = result.extension;
    } else if (dto.type === 'PROPOSAL') {
      if (!dto.estimateId) throw new BadRequestException('estimateId is required for proposals');
      const result = await this.generateProposalReport(dto.estimateId, project, company, dateStr, dto.format || 'PDF');
      buffer = result.buffer;
      reportName = dto.name || `Proposal - ${project.name}`;
      contentType = result.contentType;
      extension = result.extension;
    } else {
      throw new BadRequestException('Invalid report type');
    }

    // Save to storage
    const storagePath = `reports/${companyId}/${projectId}/${now.getTime()}_${dto.type.toLowerCase()}.${extension}`;
    await this.storage.upload(storagePath, buffer, contentType);

    // Save report record
    const report = await this.prisma.report.create({
      data: {
        projectId,
        estimateId: dto.estimateId || null,
        companyId,
        createdById: userId,
        type: dto.type as any,
        format: (dto.format || 'PDF') as any,
        name: reportName,
        storagePath,
        fileSize: buffer.length,
        metadata: { generatedAt: dateStr },
      },
    });

    return { ...report, downloadUrl: this.storage.getUrl(storagePath) };
  }

  async download(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report || !report.storagePath) throw new NotFoundException('Report not found');

    const buffer = await this.storage.download(report.storagePath);
    const ext = report.format === 'PDF' ? 'pdf' : report.format === 'CSV' ? 'csv' : 'json';
    const contentType = report.format === 'PDF' ? 'application/pdf' :
      report.format === 'CSV' ? 'text/csv' : 'application/json';

    return { buffer, filename: `${report.name}.${ext}`, contentType };
  }

  async delete(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.storagePath) {
      try { await this.storage.delete(report.storagePath); } catch {}
    }
    return this.prisma.report.delete({ where: { id } });
  }

  // ---- Private generators ----

  private async generateTakeoffReport(project: any, company: any, dateStr: string, format: string) {
    // Aggregate takeoff data
    const items = await this.prisma.takeoffItem.findMany({
      where: { projectId: project.id },
      include: { category: true },
    });

    const catMap = new Map<string, { name: string; code: string; count: number; totalQuantity: number; unit: string }>();
    for (const item of items) {
      const key = item.categoryId;
      const existing = catMap.get(key);
      const qty = Number(item.quantity || 1);
      const length = Number(item.length || 0);
      const area = Number(item.area || 0);
      if (existing) {
        existing.count += 1;
        existing.totalQuantity += (item.category?.measureType === 'LINEAR' ? length :
          item.category?.measureType === 'AREA' ? area : qty);
      } else {
        catMap.set(key, {
          name: item.category?.name || 'Unknown',
          code: item.category?.code || '',
          count: 1,
          totalQuantity: item.category?.measureType === 'LINEAR' ? length :
            item.category?.measureType === 'AREA' ? area : qty,
          unit: item.category?.unit || 'ea',
        });
      }
    }

    const categories = Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    if (format === 'CSV') {
      const headers = ['Category', 'Code', 'Count', 'Total Quantity', 'Unit'];
      const rows = categories.map(c => [c.name, c.code, String(c.count), c.totalQuantity.toFixed(1), c.unit]);
      return {
        buffer: await this.pdfGenerator.generateCsv(headers, rows),
        contentType: 'text/csv',
        extension: 'csv',
      };
    }

    if (format === 'JSON') {
      const jsonData = { project: { name: project.name }, categories, totalItems: items.length, generatedAt: dateStr };
      return {
        buffer: Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8'),
        contentType: 'application/json',
        extension: 'json',
      };
    }

    // PDF
    return {
      buffer: await this.pdfGenerator.generateTakeoffSummary({
        project, company, categories, totalItems: items.length, generatedAt: dateStr,
      }),
      contentType: 'application/pdf',
      extension: 'pdf',
    };
  }

  private async generateEstimateReport(estimateId: string, project: any, company: any, dateStr: string, format: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!estimate) throw new NotFoundException('Estimate not found');

    const lines = estimate.lines.map(l => ({
      description: l.description,
      quantity: Number(l.quantity),
      unit: l.unit,
      materialCost: Number(l.materialCost),
      laborCost: Number(l.laborCost),
      totalCost: Number(l.totalCost),
    }));

    const estData = {
      name: estimate.name,
      version: estimate.version,
      status: estimate.status,
      subtotal: Number(estimate.subtotal),
      markupPercent: Number(estimate.markupPercent),
      markupAmount: Number(estimate.markupAmount),
      taxPercent: Number(estimate.taxPercent),
      taxAmount: Number(estimate.taxAmount),
      totalAmount: Number(estimate.totalAmount),
    };

    if (format === 'CSV') {
      const headers = ['Description', 'Qty', 'Unit', 'Material', 'Labor', 'Total'];
      const rows = lines.map(l => [
        l.description, String(l.quantity), l.unit,
        l.materialCost.toFixed(2), l.laborCost.toFixed(2), l.totalCost.toFixed(2),
      ]);
      rows.push(['', '', '', '', 'Subtotal', estData.subtotal.toFixed(2)]);
      rows.push(['', '', '', '', `Markup (${estData.markupPercent}%)`, estData.markupAmount.toFixed(2)]);
      rows.push(['', '', '', '', `Tax (${estData.taxPercent}%)`, estData.taxAmount.toFixed(2)]);
      rows.push(['', '', '', '', 'TOTAL', estData.totalAmount.toFixed(2)]);
      return {
        buffer: await this.pdfGenerator.generateCsv(headers, rows),
        contentType: 'text/csv',
        extension: 'csv',
      };
    }

    if (format === 'JSON') {
      return {
        buffer: Buffer.from(JSON.stringify({ project: { name: project.name }, estimate: estData, lines, generatedAt: dateStr }, null, 2), 'utf-8'),
        contentType: 'application/json',
        extension: 'json',
      };
    }

    return {
      buffer: await this.pdfGenerator.generateEstimateSummary({
        project, company, estimate: estData, lines, generatedAt: dateStr,
      }),
      contentType: 'application/pdf',
      extension: 'pdf',
    };
  }

  private async generateProposalReport(estimateId: string, project: any, company: any, dateStr: string, format: string) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!estimate) throw new NotFoundException('Estimate not found');

    const lines = estimate.lines.map(l => ({
      description: l.description,
      quantity: Number(l.quantity),
      unit: l.unit,
      materialCost: Number(l.materialCost),
      laborCost: Number(l.laborCost),
      totalCost: Number(l.totalCost),
    }));

    const estData = {
      name: estimate.name,
      version: estimate.version,
      status: estimate.status,
      subtotal: Number(estimate.subtotal),
      markupPercent: Number(estimate.markupPercent),
      markupAmount: Number(estimate.markupAmount),
      taxPercent: Number(estimate.taxPercent),
      taxAmount: Number(estimate.taxAmount),
      totalAmount: Number(estimate.totalAmount),
    };

    // Proposals are always PDF
    return {
      buffer: await this.pdfGenerator.generateProposal({
        project, company, estimate: estData, lines, generatedAt: dateStr,
        validUntil: estimate.validUntil?.toLocaleDateString('en-US') || undefined,
        notes: estimate.notes || undefined,
      }),
      contentType: 'application/pdf',
      extension: 'pdf',
    };
  }
}
