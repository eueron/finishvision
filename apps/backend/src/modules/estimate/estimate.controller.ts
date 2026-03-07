import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EstimateService } from './estimate.service';
import {
  CreateEstimateDto, UpdateEstimateDto, AddEstimateLineDto,
  UpdateEstimateLineDto, GenerateEstimateDto,
} from './dto';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class EstimateController {
  constructor(private readonly estimateService: EstimateService) {}

  // --- Estimates ---

  @Get('projects/:projectId/estimates')
  async findByProject(@Param('projectId') projectId: string) {
    return { data: await this.estimateService.findByProject(projectId) };
  }

  @Get('estimates/:id')
  async findOne(@Param('id') id: string) {
    return { data: await this.estimateService.findOne(id) };
  }

  @Post('projects/:projectId/estimates')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEstimateDto,
    @Request() req: any,
  ) {
    return {
      data: await this.estimateService.create(
        projectId, req.user.companyId, req.user.sub, dto,
      ),
    };
  }

  @Post('projects/:projectId/estimates/generate')
  async generateFromTakeoff(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateEstimateDto,
    @Request() req: any,
  ) {
    return {
      data: await this.estimateService.generateFromTakeoff(
        projectId, req.user.companyId, req.user.sub, dto,
      ),
    };
  }

  @Patch('estimates/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateEstimateDto) {
    return { data: await this.estimateService.update(id, dto) };
  }

  @Delete('estimates/:id')
  async delete(@Param('id') id: string) {
    return { data: await this.estimateService.delete(id) };
  }

  // --- Estimate Lines ---

  @Post('estimates/:estimateId/lines')
  async addLine(
    @Param('estimateId') estimateId: string,
    @Body() dto: AddEstimateLineDto,
  ) {
    return { data: await this.estimateService.addLine(estimateId, dto) };
  }

  @Patch('estimate-lines/:lineId')
  async updateLine(
    @Param('lineId') lineId: string,
    @Body() dto: UpdateEstimateLineDto,
  ) {
    return { data: await this.estimateService.updateLine(lineId, dto) };
  }

  @Delete('estimate-lines/:lineId')
  async deleteLine(@Param('lineId') lineId: string) {
    return { data: await this.estimateService.deleteLine(lineId) };
  }
}
