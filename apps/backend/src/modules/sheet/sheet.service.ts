import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { UpdateSheetDto } from './dto';

@Injectable()
export class SheetService {
  constructor(private prisma: PrismaService) {}

  private async verifySheetOwnership(sheetId: string, companyId: string) {
    const sheet = await this.prisma.sheet.findUnique({
      where: { id: sheetId },
      include: {
        blueprint: {
          include: { project: { select: { companyId: true } } },
        },
      },
    });
    if (!sheet) throw new NotFoundException('Sheet not found');
    if (sheet.blueprint.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return sheet;
  }

  async findByBlueprint(blueprintId: string, companyId: string) {
    const blueprint = await this.prisma.blueprint.findUnique({
      where: { id: blueprintId },
      include: { project: { select: { companyId: true } } },
    });
    if (!blueprint) throw new NotFoundException('Blueprint not found');
    if (blueprint.project.companyId !== companyId) throw new ForbiddenException('Access denied');

    return this.prisma.sheet.findMany({
      where: { blueprintId },
      orderBy: { pageNumber: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    return this.verifySheetOwnership(id, companyId);
  }

  async update(id: string, companyId: string, dto: UpdateSheetDto) {
    await this.verifySheetOwnership(id, companyId);
    return this.prisma.sheet.update({
      where: { id },
      data: {
        sheetName: dto.sheetName,
        sheetType: dto.sheetType as any,
        scaleText: dto.scaleText,
        scaleFactor: dto.scaleFactor,
      },
    });
  }

  async updateScale(id: string, companyId: string, scaleText: string, scaleFactor: number) {
    await this.verifySheetOwnership(id, companyId);
    return this.prisma.sheet.update({
      where: { id },
      data: { scaleText, scaleFactor },
    });
  }
}
