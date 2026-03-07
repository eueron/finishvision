import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateRoomDto, UpdateRoomDto } from './dto';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  private async verifyUnitOwnership(unitId: string, companyId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        floor: { include: { building: { include: { project: { select: { companyId: true } } } } } },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.floor.building.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return unit;
  }

  async findAll(unitId: string, companyId: string) {
    await this.verifyUnitOwnership(unitId, companyId);
    return this.prisma.room.findMany({
      where: { unitId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            floor: { include: { building: { include: { project: { select: { companyId: true } } } } } },
          },
        },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.unit.floor.building.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return room;
  }

  async create(unitId: string, companyId: string, dto: CreateRoomDto) {
    await this.verifyUnitOwnership(unitId, companyId);
    const maxSort = await this.prisma.room.aggregate({
      where: { unitId },
      _max: { sortOrder: true },
    });
    return this.prisma.room.create({
      data: {
        unitId,
        name: dto.name,
        roomType: dto.roomType,
        sortOrder: dto.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async update(id: string, companyId: string, dto: UpdateRoomDto) {
    await this.findOne(id, companyId);
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.room.delete({ where: { id } });
  }
}
