import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateUnitDto, UpdateUnitDto, BulkCreateUnitsDto } from './dto';

@Injectable()
export class UnitService {
  constructor(private prisma: PrismaService) {}

  private async verifyFloorOwnership(floorId: string, companyId: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id: floorId },
      include: { building: { include: { project: { select: { companyId: true } } } } },
    });
    if (!floor) throw new NotFoundException('Floor not found');
    if (floor.building.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return floor;
  }

  async findAll(floorId: string, companyId: string) {
    await this.verifyFloorOwnership(floorId, companyId);
    return this.prisma.unit.findMany({
      where: { floorId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { rooms: true } },
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        floor: { include: { building: { include: { project: { select: { companyId: true } } } } } },
        rooms: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.floor.building.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return unit;
  }

  async create(floorId: string, companyId: string, dto: CreateUnitDto) {
    await this.verifyFloorOwnership(floorId, companyId);

    const maxSort = await this.prisma.unit.aggregate({
      where: { floorId },
      _max: { sortOrder: true },
    });

    return this.prisma.$transaction(async (tx) => {
      const unit = await tx.unit.create({
        data: {
          floorId,
          name: dto.name,
          unitType: dto.unitType,
          sortOrder: dto.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        },
      });

      // Create rooms from template if provided
      if (dto.rooms && dto.rooms.length > 0) {
        await tx.room.createMany({
          data: dto.rooms.map((room, index) => ({
            unitId: unit.id,
            name: room.name,
            roomType: room.roomType,
            sortOrder: index + 1,
          })),
        });
      }

      return tx.unit.findUnique({
        where: { id: unit.id },
        include: { rooms: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async bulkCreate(floorId: string, companyId: string, dto: BulkCreateUnitsDto) {
    await this.verifyFloorOwnership(floorId, companyId);

    const maxSort = await this.prisma.unit.aggregate({
      where: { floorId },
      _max: { sortOrder: true },
    });
    const startSort = (maxSort._max.sortOrder ?? 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      const units = [];
      for (let i = 0; i < dto.count; i++) {
        const unitNumber = dto.startNumber + i;
        const unit = await tx.unit.create({
          data: {
            floorId,
            name: `${dto.prefix}${unitNumber}`,
            unitType: dto.unitType,
            sortOrder: startSort + i,
          },
        });

        if (dto.roomTemplate && dto.roomTemplate.length > 0) {
          await tx.room.createMany({
            data: dto.roomTemplate.map((room, idx) => ({
              unitId: unit.id,
              name: room.name,
              roomType: room.roomType,
              sortOrder: idx + 1,
            })),
          });
        }

        units.push(unit);
      }

      return tx.unit.findMany({
        where: { floorId },
        orderBy: { sortOrder: 'asc' },
        include: { rooms: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async update(id: string, companyId: string, dto: UpdateUnitDto) {
    await this.findOne(id, companyId);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.unit.delete({ where: { id } });
  }

  async duplicate(id: string, companyId: string) {
    const source = await this.findOne(id, companyId);

    const maxSort = await this.prisma.unit.aggregate({
      where: { floorId: source.floorId },
      _max: { sortOrder: true },
    });

    return this.prisma.$transaction(async (tx) => {
      const newUnit = await tx.unit.create({
        data: {
          floorId: source.floorId,
          name: `${source.name} (Copy)`,
          unitType: source.unitType,
          sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        },
      });

      if (source.rooms.length > 0) {
        await tx.room.createMany({
          data: source.rooms.map((room) => ({
            unitId: newUnit.id,
            name: room.name,
            roomType: room.roomType,
            sortOrder: room.sortOrder,
          })),
        });
      }

      return tx.unit.findUnique({
        where: { id: newUnit.id },
        include: { rooms: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }
}
