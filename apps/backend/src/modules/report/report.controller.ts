import {
  Controller, Get, Post, Delete, Param, Body, Res, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ReportService } from './report.service';
import { GenerateReportDto } from './dto';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('projects/:projectId/reports')
  async findByProject(@Param('projectId') projectId: string) {
    return { data: await this.reportService.findByProject(projectId) };
  }

  @Get('reports/:id')
  async findOne(@Param('id') id: string) {
    return { data: await this.reportService.findOne(id) };
  }

  @Post('projects/:projectId/reports/generate')
  async generate(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateReportDto,
    @Request() req: any,
  ) {
    return {
      data: await this.reportService.generate(
        projectId, req.user.companyId, req.user.sub, dto,
      ),
    };
  }

  @Get('reports/:id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename, contentType } = await this.reportService.download(id);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Delete('reports/:id')
  async delete(@Param('id') id: string) {
    return { data: await this.reportService.delete(id) };
  }
}
