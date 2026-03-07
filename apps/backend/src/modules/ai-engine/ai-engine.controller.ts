import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiEngineService } from './ai-engine.service';
import { TriggerAiAnalysisDto, ReviewDetectionDto, BulkReviewDto } from './dto';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class AiEngineController {
  constructor(private readonly aiService: AiEngineService) {}

  // ---- Trigger Analysis ----

  @Post('sheets/:sheetId/ai/analyze')
  async triggerAnalysis(
    @Param('sheetId') sheetId: string,
    @Body() dto: Partial<TriggerAiAnalysisDto>,
    @Request() req: any,
  ) {
    // Get projectId from sheet
    return {
      data: await this.aiService.triggerAnalysis(
        sheetId,
        req.body.projectId || '',
        req.user.companyId,
        req.user.sub,
        dto.steps,
      ),
    };
  }

  @Post('projects/:projectId/sheets/:sheetId/ai/analyze')
  async triggerProjectAnalysis(
    @Param('projectId') projectId: string,
    @Param('sheetId') sheetId: string,
    @Body() dto: Partial<TriggerAiAnalysisDto>,
    @Request() req: any,
  ) {
    return {
      data: await this.aiService.triggerAnalysis(
        sheetId,
        projectId,
        req.user.companyId,
        req.user.sub,
        dto.steps,
      ),
    };
  }

  // ---- Jobs ----

  @Get('ai/jobs/:jobId')
  async getJob(@Param('jobId') jobId: string) {
    return { data: await this.aiService.getJob(jobId) };
  }

  @Get('sheets/:sheetId/ai/jobs')
  async getJobsBySheet(@Param('sheetId') sheetId: string) {
    return { data: await this.aiService.getJobsBySheet(sheetId) };
  }

  @Get('projects/:projectId/ai/jobs')
  async getJobsByProject(@Param('projectId') projectId: string) {
    return { data: await this.aiService.getJobsByProject(projectId) };
  }

  // ---- Detections ----

  @Get('sheets/:sheetId/ai/detections')
  async getDetectionsBySheet(
    @Param('sheetId') sheetId: string,
    @Query('status') status?: string,
  ) {
    return { data: await this.aiService.getDetectionsBySheet(sheetId, status) };
  }

  @Get('projects/:projectId/ai/detections')
  async getDetectionsByProject(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    return { data: await this.aiService.getDetectionsByProject(projectId, status) };
  }

  @Get('projects/:projectId/ai/summary')
  async getDetectionSummary(@Param('projectId') projectId: string) {
    return { data: await this.aiService.getDetectionSummary(projectId) };
  }

  // ---- Review ----

  @Patch('ai/detections/:detectionId/review')
  async reviewDetection(
    @Param('detectionId') detectionId: string,
    @Body() dto: ReviewDetectionDto,
    @Request() req: any,
  ) {
    return {
      data: await this.aiService.reviewDetection(detectionId, req.user.sub, dto),
    };
  }

  @Post('ai/detections/bulk-review')
  async bulkReview(@Body() dto: BulkReviewDto, @Request() req: any) {
    return {
      data: await this.aiService.bulkReview(req.user.sub, dto),
    };
  }
}
