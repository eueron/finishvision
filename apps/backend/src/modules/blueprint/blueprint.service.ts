import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { PdfProcessorService } from './pdf-processor.service';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

@Injectable()
export class BlueprintService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private pdfProcessor: PdfProcessorService,
  ) {}

  private async verifyProjectOwnership(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
    });
    if (!project) throw new ForbiddenException('Project not found or access denied');
    return project;
  }

  async findAll(projectId: string, companyId: string) {
    await this.verifyProjectOwnership(projectId, companyId);
    return this.prisma.blueprint.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sheets: true } },
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const blueprint = await this.prisma.blueprint.findUnique({
      where: { id },
      include: {
        project: { select: { companyId: true } },
        sheets: { orderBy: { pageNumber: 'asc' } },
      },
    });
    if (!blueprint || blueprint.deletedAt) throw new NotFoundException('Blueprint not found');
    if (blueprint.project.companyId !== companyId) throw new ForbiddenException('Access denied');
    return blueprint;
  }

  async upload(
    projectId: string,
    companyId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    await this.verifyProjectOwnership(projectId, companyId);

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are accepted');
    }

    // Max 100MB
    if (file.size > 100 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 100MB limit');
    }

    // Determine storage path
    const storagePath = `companies/${companyId}/projects/${projectId}/blueprints/${Date.now()}-${file.originalname}`;

    // Save file to local storage (or S3 in production)
    const localDir = path.join(os.tmpdir(), 'fv-uploads');
    fs.mkdirSync(localDir, { recursive: true });
    const localPath = path.join(localDir, `${Date.now()}-${file.originalname}`);
    fs.writeFileSync(localPath, file.buffer);

    // Upload to storage
    await this.storageService.uploadFile(localPath, storagePath);

    // Create blueprint record
    const blueprint = await this.prisma.blueprint.create({
      data: {
        projectId,
        uploadedById: userId,
        originalName: file.originalname,
        storagePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'UPLOADING',
      },
    });

    // Process PDF asynchronously (in production, this would be a queue job)
    this.pdfProcessor.processBlueprint(blueprint.id, localPath).catch((err) => {
      console.error(`Background processing failed for ${blueprint.id}:`, err);
    });

    return blueprint;
  }

  async remove(id: string, companyId: string) {
    const blueprint = await this.findOne(id, companyId);

    // Soft delete
    return this.prisma.blueprint.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getSheetImage(sheetId: string, companyId: string, type: 'image' | 'thumbnail' = 'image') {
    const sheet = await this.prisma.sheet.findUnique({
      where: { id: sheetId },
      include: {
        blueprint: {
          include: { project: { select: { companyId: true } } },
        },
      },
    });

    if (!sheet) throw new NotFoundException('Sheet not found');
    if (sheet.blueprint.project.companyId !== companyId) throw new ForbiddenException('Access denied');

    const filePath = type === 'thumbnail' ? sheet.thumbnailPath : sheet.imagePath;
    if (!filePath) throw new NotFoundException('Image not available');

    return this.storageService.getFileUrl(filePath);
  }
}
