import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, status?: string, search?: string) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { generalContractor: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { buildings: true },
        },
      },
    });
  }

  async findOne(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
      include: {
        buildings: {
          orderBy: { sortOrder: 'asc' },
          include: {
            floors: {
              orderBy: { sortOrder: 'asc' },
              include: {
                units: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    rooms: {
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(companyId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        companyId,
      },
    });
  }

  async update(companyId: string, projectId: string, dto: UpdateProjectDto) {
    // Verify ownership
    await this.findOne(companyId, projectId);

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async softDelete(companyId: string, projectId: string) {
    await this.findOne(companyId, projectId);

    return this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });
  }
}
