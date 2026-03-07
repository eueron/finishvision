import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BuildingService } from './building.service';
import { CreateBuildingDto, UpdateBuildingDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller('projects/:projectId/buildings')
@UseGuards(AuthGuard('jwt'))
export class BuildingController {
  constructor(private buildingService: BuildingService) {}

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.buildingService.findAll(projectId, user.companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.buildingService.findOne(id, user.companyId);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBuildingDto,
  ) {
    return this.buildingService.create(projectId, user.companyId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBuildingDto,
  ) {
    return this.buildingService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.buildingService.remove(id, user.companyId);
  }

  @Patch('reorder')
  async reorder(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.buildingService.reorder(projectId, user.companyId, body.orderedIds);
  }
}
