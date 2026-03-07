import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FloorService } from './floor.service';
import { CreateFloorDto, UpdateFloorDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller('buildings/:buildingId/floors')
@UseGuards(AuthGuard('jwt'))
export class FloorController {
  constructor(private floorService: FloorService) {}

  @Get()
  async findAll(
    @Param('buildingId') buildingId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.floorService.findAll(buildingId, user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.floorService.findOne(id, user.companyId);
  }

  @Post()
  async create(
    @Param('buildingId') buildingId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFloorDto,
  ) {
    return this.floorService.create(buildingId, user.companyId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateFloorDto,
  ) {
    return this.floorService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.floorService.remove(id, user.companyId);
  }
}
