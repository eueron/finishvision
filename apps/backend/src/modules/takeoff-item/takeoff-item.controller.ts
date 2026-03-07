import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TakeoffItemService } from './takeoff-item.service';
import { CreateTakeoffItemDto, UpdateTakeoffItemDto, BulkCreateTakeoffItemDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class TakeoffItemController {
  constructor(private service: TakeoffItemService) {}

  // List items by project
  @Get('projects/:projectId/takeoff-items')
  async findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Query('categoryId') categoryId?: string,
    @Query('sheetId') sheetId?: string,
    @Query('roomId') roomId?: string,
    @Query('source') source?: string,
    @Query('verified') verified?: string,
  ) {
    return this.service.findByProject(projectId, user.companyId, {
      categoryId,
      sheetId,
      roomId,
      source,
      verified: verified !== undefined ? verified === 'true' : undefined,
    });
  }

  // List items by sheet (for viewer)
  @Get('sheets/:sheetId/takeoff-items')
  async findBySheet(
    @Param('sheetId') sheetId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findBySheet(sheetId, user.companyId);
  }

  // Create single item
  @Post('projects/:projectId/takeoff-items')
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTakeoffItemDto,
  ) {
    return this.service.create(projectId, user.sub, user.companyId, dto);
  }

  // Bulk create items
  @Post('projects/:projectId/takeoff-items/bulk')
  async bulkCreate(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: BulkCreateTakeoffItemDto,
  ) {
    return this.service.bulkCreate(projectId, user.sub, user.companyId, dto);
  }

  // Update item
  @Patch('takeoff-items/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTakeoffItemDto,
  ) {
    return this.service.update(id, user.companyId, dto);
  }

  // Delete item (soft)
  @Delete('takeoff-items/:id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.remove(id, user.companyId);
  }

  // Get takeoff summary
  @Get('projects/:projectId/takeoff-summary')
  async getSummary(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getSummary(projectId, user.companyId);
  }
}
