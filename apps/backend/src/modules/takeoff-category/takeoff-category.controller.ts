import {
  Controller, Get, Post, Patch,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TakeoffCategoryService } from './takeoff-category.service';
import { CreateTakeoffCategoryDto, UpdateTakeoffCategoryDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller('takeoff-categories')
@UseGuards(AuthGuard('jwt'))
export class TakeoffCategoryController {
  constructor(private service: TakeoffCategoryService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.companyId);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTakeoffCategoryDto,
  ) {
    return this.service.create(user.companyId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTakeoffCategoryDto,
  ) {
    return this.service.update(id, user.companyId, dto);
  }
}
