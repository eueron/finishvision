import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnitService } from './unit.service';
import { CreateUnitDto, UpdateUnitDto, BulkCreateUnitsDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller('floors/:floorId/units')
@UseGuards(AuthGuard('jwt'))
export class UnitController {
  constructor(private unitService: UnitService) {}

  @Get()
  async findAll(
    @Param('floorId') floorId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.unitService.findAll(floorId, user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.unitService.findOne(id, user.companyId);
  }

  @Post()
  async create(
    @Param('floorId') floorId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateUnitDto,
  ) {
    return this.unitService.create(floorId, user.companyId, dto);
  }

  @Post('bulk')
  async bulkCreate(
    @Param('floorId') floorId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: BulkCreateUnitsDto,
  ) {
    return this.unitService.bulkCreate(floorId, user.companyId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.unitService.remove(id, user.companyId);
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.unitService.duplicate(id, user.companyId);
  }
}
