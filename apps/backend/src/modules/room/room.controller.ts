import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomService } from './room.service';
import { CreateRoomDto, UpdateRoomDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller('units/:unitId/rooms')
@UseGuards(AuthGuard('jwt'))
export class RoomController {
  constructor(private roomService: RoomService) {}

  @Get()
  async findAll(
    @Param('unitId') unitId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomService.findAll(unitId, user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomService.findOne(id, user.companyId);
  }

  @Post()
  async create(
    @Param('unitId') unitId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomService.create(unitId, user.companyId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomService.remove(id, user.companyId);
  }
}
