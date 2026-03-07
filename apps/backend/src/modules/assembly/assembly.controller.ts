import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssemblyService } from './assembly.service';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto';

@Controller('assemblies')
@UseGuards(AuthGuard('jwt'))
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @Get()
  async findAll(@Request() req: any) {
    return { data: await this.assemblyService.findAll(req.user.companyId) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { data: await this.assemblyService.findOne(id) };
  }

  @Post()
  async create(@Body() dto: CreateAssemblyDto, @Request() req: any) {
    return { data: await this.assemblyService.create(dto, req.user.companyId) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAssemblyDto) {
    return { data: await this.assemblyService.update(id, dto) };
  }
}
