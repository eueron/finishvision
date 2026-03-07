import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { OcrService, OcrResult } from './ocr.service';
import { VisionService, VisionDetection } from './vision.service';
import { ReviewDetectionDto, BulkReviewDto } from './dto';

// Map DetectionType to TakeoffCategory codes
const TYPE_TO_CATEGORY: Record<string, string> = {
  DOOR_SINGLE: 'INT_DOOR',
  DOOR_DOUBLE: 'DBL_DOOR',
  DOOR_SLIDING: 'SLD_DOOR',
  DOOR_POCKET: 'PKT_DOOR',
  DOOR_BIFOLD: 'BIF_DOOR',
  DOOR_METAL: 'MTL_DOOR',
  WINDOW: 'WINDOW',
  CLOSET: 'CLOSET_STD',
  CABINET_RUN: 'CAB_BASE',
  ROOM_LABEL: '',
  DIMENSION: '',
  SCHEDULE_ENTRY: '',
  SYMBOL_OTHER: '',
};

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private ocrService: OcrService,
    private visionService: VisionService,
  ) {}

  // ========================================
  // TRIGGER AI ANALYSIS
  // ========================================

  async triggerAnalysis(
    sheetId: string,
    projectId: string,
    companyId: string,
    userId: string,
    steps?: string[],
  ) {
    // Validate sheet exists
    const sheet = await this.prisma.sheet.findUnique({
      where: { id: sheetId },
      include: { blueprint: true },
    });
    if (!sheet) throw new NotFoundException('Sheet not found');

    // Create AI job
    const job = await this.prisma.aiJob.create({
      data: {
        sheetId,
        projectId,
        companyId,
        triggeredById: userId,
        status: 'QUEUED',
        pipelineSteps: { requested: steps || ['ocr', 'detection', 'classification'] },
      },
    });

    // Run pipeline asynchronously (in production this would be a queue job)
    this.runPipeline(job.id, sheet, steps).catch((err) => {
      this.logger.error(`Pipeline failed for job ${job.id}: ${err.message}`);
    });

    return job;
  }

  private async runPipeline(jobId: string, sheet: any, steps?: string[]) {
    const startTime = Date.now();
    const runSteps = steps || ['ocr', 'detection', 'classification'];
    const completedSteps: string[] = [];

    try {
      // Mark as processing
      await this.prisma.aiJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', startedAt: new Date() },
      });

      // Get the image path
      const imagePath = sheet.imagePath
        ? this.storage.getLocalPath(sheet.imagePath) || `/tmp/fv-storage/${sheet.imagePath}`
        : null;

      let ocrResult: OcrResult | null = null;

      // Step 1: OCR
      if (runSteps.includes('ocr') && imagePath) {
        this.logger.log(`[Job ${jobId}] Running OCR...`);
        try {
          ocrResult = await this.ocrService.processImage(imagePath);
          await this.prisma.aiJob.update({
            where: { id: jobId },
            data: {
              ocrText: ocrResult.fullText,
              ocrMetadata: {
                roomNames: ocrResult.roomNames,
                dimensions: ocrResult.dimensions,
                doorTags: ocrResult.doorTags,
                windowTags: ocrResult.windowTags,
                annotations: ocrResult.annotations,
                confidence: ocrResult.confidence,
              },
            },
          });

          // Update sheet OCR text
          await this.prisma.sheet.update({
            where: { id: sheet.id },
            data: { ocrText: ocrResult.fullText, ocrCompleted: true },
          });

          completedSteps.push('ocr');
        } catch (err: any) {
          this.logger.warn(`[Job ${jobId}] OCR failed: ${err.message}`);
        }
      }

      // Step 2: Vision Detection
      if (runSteps.includes('detection') && imagePath) {
        this.logger.log(`[Job ${jobId}] Running vision detection...`);
        try {
          const visionResult = await this.visionService.analyzeSheet(imagePath);

          // Update sheet type if detected
          if (visionResult.sheetType && visionResult.sheetType !== 'OTHER') {
            await this.prisma.sheet.update({
              where: { id: sheet.id },
              data: { sheetType: visionResult.sheetType as any },
            });
          }

          // Create detection records
          if (visionResult.detections.length > 0) {
            await this.createDetections(jobId, sheet, visionResult.detections);
          }

          completedSteps.push('detection');
        } catch (err: any) {
          this.logger.warn(`[Job ${jobId}] Vision detection failed: ${err.message}`);
        }
      }

      // Step 3: Classification (match detections to categories)
      if (runSteps.includes('classification')) {
        this.logger.log(`[Job ${jobId}] Running classification...`);
        try {
          await this.classifyDetections(jobId);
          completedSteps.push('classification');
        } catch (err: any) {
          this.logger.warn(`[Job ${jobId}] Classification failed: ${err.message}`);
        }
      }

      // Mark as completed
      const processingMs = Date.now() - startTime;
      await this.prisma.aiJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          processingMs,
          pipelineSteps: { requested: runSteps, completed: completedSteps },
        },
      });

      this.logger.log(`[Job ${jobId}] Pipeline completed in ${processingMs}ms. Steps: ${completedSteps.join(', ')}`);
    } catch (error: any) {
      await this.prisma.aiJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date(),
          processingMs: Date.now() - startTime,
          pipelineSteps: { requested: runSteps, completed: completedSteps, error: error.message },
        },
      });
    }
  }

  private async createDetections(jobId: string, sheet: any, detections: VisionDetection[]) {
    const job = await this.prisma.aiJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    for (const det of detections) {
      // Convert percentage-based bounding box to pixel coordinates
      const bbox = {
        x: Math.round((det.boundingBox.x / 100) * (sheet.width || 1000)),
        y: Math.round((det.boundingBox.y / 100) * (sheet.height || 1000)),
        width: Math.round((det.boundingBox.width / 100) * (sheet.width || 1000)),
        height: Math.round((det.boundingBox.height / 100) * (sheet.height || 1000)),
      };

      // Find matching category
      const categoryCode = TYPE_TO_CATEGORY[det.type] || '';
      let categoryId: string | null = null;
      if (categoryCode) {
        const category = await this.prisma.takeoffCategory.findFirst({
          where: { code: categoryCode, isSystem: true },
        });
        categoryId = category?.id || null;
      }

      await this.prisma.aiDetection.create({
        data: {
          aiJobId: jobId,
          sheetId: sheet.id,
          projectId: job.projectId,
          type: det.type as any,
          label: det.label,
          confidence: det.confidence,
          boundingBox: bbox,
          coordinates: det.metadata?.points ? { points: det.metadata.points } : undefined,
          metadata: det.metadata || undefined,
          categoryId,
          status: 'PENDING',
        },
      });
    }
  }

  private async classifyDetections(jobId: string) {
    const detections = await this.prisma.aiDetection.findMany({
      where: { aiJobId: jobId, categoryId: null },
    });

    for (const det of detections) {
      const categoryCode = TYPE_TO_CATEGORY[det.type] || '';
      if (!categoryCode) continue;

      const category = await this.prisma.takeoffCategory.findFirst({
        where: { code: categoryCode, isSystem: true },
      });

      if (category) {
        await this.prisma.aiDetection.update({
          where: { id: det.id },
          data: { categoryId: category.id },
        });
      }
    }
  }

  // ========================================
  // JOB MANAGEMENT
  // ========================================

  async getJob(jobId: string) {
    const job = await this.prisma.aiJob.findUnique({
      where: { id: jobId },
      include: {
        detections: {
          include: { category: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!job) throw new NotFoundException('AI Job not found');
    return job;
  }

  async getJobsBySheet(sheetId: string) {
    return this.prisma.aiJob.findMany({
      where: { sheetId },
      include: { _count: { select: { detections: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobsByProject(projectId: string) {
    return this.prisma.aiJob.findMany({
      where: { projectId },
      include: {
        sheet: { select: { id: true, sheetName: true, pageNumber: true } },
        _count: { select: { detections: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========================================
  // DETECTION MANAGEMENT
  // ========================================

  async getDetectionsBySheet(sheetId: string, status?: string) {
    const where: any = { sheetId };
    if (status) where.status = status;

    return this.prisma.aiDetection.findMany({
      where,
      include: { category: true },
      orderBy: [{ type: 'asc' }, { confidence: 'desc' }],
    });
  }

  async getDetectionsByProject(projectId: string, status?: string) {
    const where: any = { projectId };
    if (status) where.status = status;

    return this.prisma.aiDetection.findMany({
      where,
      include: {
        category: true,
        sheet: { select: { id: true, sheetName: true, pageNumber: true } },
      },
      orderBy: [{ type: 'asc' }, { confidence: 'desc' }],
    });
  }

  async getDetectionSummary(projectId: string) {
    const detections = await this.prisma.aiDetection.findMany({
      where: { projectId },
      include: { category: true },
    });

    const summary: Record<string, { type: string; label: string; total: number; pending: number; accepted: number; rejected: number; avgConfidence: number }> = {};

    for (const det of detections) {
      if (!summary[det.type]) {
        summary[det.type] = {
          type: det.type,
          label: det.label.replace(/\s*\d.*$/, ''), // strip specific identifiers
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          avgConfidence: 0,
        };
      }
      const s = summary[det.type];
      s.total++;
      s.avgConfidence = (s.avgConfidence * (s.total - 1) + Number(det.confidence)) / s.total;
      if (det.status === 'PENDING') s.pending++;
      else if (det.status === 'ACCEPTED' || det.status === 'MODIFIED') s.accepted++;
      else if (det.status === 'REJECTED') s.rejected++;
    }

    return {
      totalDetections: detections.length,
      pendingReview: detections.filter((d) => d.status === 'PENDING').length,
      accepted: detections.filter((d) => d.status === 'ACCEPTED' || d.status === 'MODIFIED').length,
      rejected: detections.filter((d) => d.status === 'REJECTED').length,
      byType: Object.values(summary),
    };
  }

  // ========================================
  // REVIEW WORKFLOW
  // ========================================

  async reviewDetection(detectionId: string, userId: string, dto: ReviewDetectionDto) {
    const detection = await this.prisma.aiDetection.findUnique({ where: { id: detectionId } });
    if (!detection) throw new NotFoundException('Detection not found');

    const updateData: any = {
      status: dto.status,
      reviewedById: userId,
      reviewedAt: new Date(),
      reviewNotes: dto.reviewNotes || null,
    };

    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.label) updateData.label = dto.label;

    const updated = await this.prisma.aiDetection.update({
      where: { id: detectionId },
      data: updateData,
      include: { category: true },
    });

    // If accepted, create a takeoff item
    if (dto.status === 'ACCEPTED' || dto.status === 'MODIFIED') {
      await this.createTakeoffFromDetection(updated);
    }

    return updated;
  }

  async bulkReview(userId: string, dto: BulkReviewDto) {
    const results = [];
    for (const id of dto.detectionIds) {
      try {
        const result = await this.reviewDetection(id, userId, {
          status: dto.status as any,
        });
        results.push({ id, success: true, status: result.status });
      } catch (err: any) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }

  private async createTakeoffFromDetection(detection: any) {
    if (!detection.categoryId) return;

    try {
      // Get the job to find who triggered it
      const job = await this.prisma.aiJob.findFirst({
        where: { id: detection.aiJobId },
      });

      const takeoffItem = await this.prisma.takeoffItem.create({
        data: {
          projectId: detection.projectId,
          sheetId: detection.sheetId,
          categoryId: detection.categoryId,
          createdById: job?.triggeredById || detection.reviewedById || '',
          label: detection.label,
          quantity: 1,
          coordinates: detection.boundingBox,
          verified: false,
          source: 'AI_DETECTED',
          confidence: Number(detection.confidence),
        },
      });

      // Link detection to takeoff item
      await this.prisma.aiDetection.update({
        where: { id: detection.id },
        data: { takeoffItemId: takeoffItem.id },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to create takeoff from detection: ${err.message}`);
    }
  }
}
