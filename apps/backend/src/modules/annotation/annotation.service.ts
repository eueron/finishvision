import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto';

@Injectable()
export class AnnotationService {
  constructor(private prisma: PrismaService) {}

  private async verifySheetAccess(sheetId: string, companyId: string) {
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

  async findBySheet(sheetId: string, companyId: string) {
    await this.verifySheetAccess(sheetId, companyId);
    return this.prisma.annotation.findMany({
      where: { sheetId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(sheetId: string, userId: string, companyId: string, dto: CreateAnnotationDto) {
    await this.verifySheetAccess(sheetId, companyId);

    const annotation = await this.prisma.annotation.create({
      data: {
        sheetId,
        createdById: userId,
        type: dto.type as any,
        label: dto.label,
        data: dto.data,
        color: dto.color,
      },
    });

    // If this is a calibration annotation, update the sheet's scale
    if (dto.type === 'CALIBRATION' && dto.data) {
      const { scaleText, scaleFactor } = dto.data as any;
      if (scaleFactor) {
        await this.prisma.sheet.update({
          where: { id: sheetId },
          data: { scaleText, scaleFactor },
        });
      }
    }

    return annotation;
  }

  async update(id: string, companyId: string, dto: UpdateAnnotationDto) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
      include: {
        sheet: {
          include: {
            blueprint: {
              include: { project: { select: { companyId: true } } },
            },
          },
        },
      },
    });
    if (!annotation) throw new NotFoundException('Annotation not found');
    if (annotation.sheet.blueprint.project.companyId !== companyId) throw new ForbiddenException('Access denied');

    return this.prisma.annotation.update({
      where: { id },
      data: {
        label: dto.label,
        data: dto.data,
        color: dto.color,
        visible: dto.visible,
      },
    });
  }

  async remove(id: string, companyId: string) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
      include: {
        sheet: {
          include: {
            blueprint: {
              include: { project: { select: { companyId: true } } },
            },
          },
        },
      },
    });
    if (!annotation) throw new NotFoundException('Annotation not found');
    if (annotation.sheet.blueprint.project.companyId !== companyId) throw new ForbiddenException('Access denied');

    return this.prisma.annotation.delete({ where: { id } });
  }
}
