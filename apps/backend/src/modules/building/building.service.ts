import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateBuildingDto, UpdateBuildingDto } from './dto';

@Injectable()
export class BuildingService {
  constructor(private prisma: PrismaService) {}

  private async verifyProjectOwnership(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
    });
    if (!project) throw new ForbiddenException('Project not found or access denied');
    return project;
  }

  async findAll(projectId: string, companyId: string) {
    await this.verifyProjectOwnership(projectId, companyId);
    return this.prisma.building.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { floors: true } },
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        project: { select: { companyId: true } },
        floors: {
          orderBy: { sortOrder: 'asc' },
          include: {
            units: {
              orderBy: { sortOrder: 'asc' },
              include: {
                rooms: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });
    if (!building) throw new NotFoundException('Building not found');
    if (building.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return building;
  }

  async create(projectId: string, companyId: string, dto: CreateBuildingDto) {
    await this.verifyProjectOwnership(projectId, companyId);

    const maxSort = await this.prisma.building.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });

    return this.prisma.building.create({
      data: {
        projectId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async update(id: string, companyId: string, dto: UpdateBuildingDto) {
    const building = await this.findOne(id, companyId);
    return this.prisma.building.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.building.delete({ where: { id } });
  }

  async reorder(projectId: string, companyId: string, orderedIds: string[]) {
    await this.verifyProjectOwnership(projectId, companyId);
    const updates = orderedIds.map((id, index) =>
      this.prisma.building.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    );
    return this.prisma.$transaction(updates);
  }
}
