import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateFloorDto, UpdateFloorDto } from './dto';

@Injectable()
export class FloorService {
  constructor(private prisma: PrismaService) {}

  private async verifyBuildingOwnership(buildingId: string, companyId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      include: { project: { select: { companyId: true } } },
    });
    if (!building) throw new NotFoundException('Building not found');
    if (building.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return building;
  }

  async findAll(buildingId: string, companyId: string) {
    await this.verifyBuildingOwnership(buildingId, companyId);
    return this.prisma.floor.findMany({
      where: { buildingId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { units: true } } },
    });
  }

  async findOne(id: string, companyId: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id },
      include: {
        building: { include: { project: { select: { companyId: true } } } },
        units: {
          orderBy: { sortOrder: 'asc' },
          include: { rooms: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!floor) throw new NotFoundException('Floor not found');
    if (floor.building.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return floor;
  }

  async create(buildingId: string, companyId: string, dto: CreateFloorDto) {
    await this.verifyBuildingOwnership(buildingId, companyId);
    const maxSort = await this.prisma.floor.aggregate({
      where: { buildingId },
      _max: { sortOrder: true },
    });
    return this.prisma.floor.create({
      data: {
        buildingId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async update(id: string, companyId: string, dto: UpdateFloorDto) {
    await this.findOne(id, companyId);
    return this.prisma.floor.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.floor.delete({ where: { id } });
  }
}
