import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CostItemService } from './cost-item.service';
import { CreateCostItemDto, UpdateCostItemDto } from './dto';

@Controller('cost-items')
@UseGuards(AuthGuard('jwt'))
export class CostItemController {
  constructor(private readonly costItemService: CostItemService) {}

  @Get()
  async findAll(@Request() req: any) {
    return { data: await this.costItemService.findAll(req.user.companyId) };
  }

  @Post()
  async create(@Body() dto: CreateCostItemDto, @Request() req: any) {
    return { data: await this.costItemService.create(dto, req.user.companyId) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCostItemDto) {
    return { data: await this.costItemService.update(id, dto) };
  }
}
