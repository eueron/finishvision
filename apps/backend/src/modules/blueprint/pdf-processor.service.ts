import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

@Injectable()
export class PdfProcessorService {
  private readonly logger = new Logger(PdfProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * Process an uploaded PDF: extract page count, generate thumbnails and full-res images,
   * create Sheet records for each page.
   */
  async processBlueprint(blueprintId: string, filePath: string): Promise<void> {
    this.logger.log(`Processing blueprint ${blueprintId}`);

    try {
      // Update status to PROCESSING
      await this.prisma.blueprint.update({
        where: { id: blueprintId },
        data: { status: 'PROCESSING' },
      });

      // Read the PDF
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();

      this.logger.log(`PDF has ${pageCount} pages`);

      // Update page count
      await this.prisma.blueprint.update({
        where: { id: blueprintId },
        data: { pageCount },
      });

      // Get the blueprint record for storage path prefix
      const blueprint = await this.prisma.blueprint.findUnique({
        where: { id: blueprintId },
      });

      if (!blueprint) throw new Error('Blueprint not found');
      const storagePrefix = path.dirname(blueprint.storagePath);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fv-pdf-'));

      try {
        // Use pdftoppm (poppler) for PDF to image conversion — much more reliable
        // Generate full-resolution images
        const hasPoppler = this.checkPoppler();

        for (let i = 0; i < pageCount; i++) {
          const pageNum = i + 1;
          this.logger.log(`Processing page ${pageNum}/${pageCount}`);

          let imagePath: string | null = null;
          let thumbnailPath: string | null = null;
          let width: number | null = null;
          let height: number | null = null;

          if (hasPoppler) {
            try {
              // Generate full-res image (150 DPI for balance of quality and size)
              const imgPrefix = path.join(tmpDir, `page-${pageNum}`);
              execSync(
                `pdftoppm -png -r 150 -f ${pageNum} -l ${pageNum} "${filePath}" "${imgPrefix}"`,
                { timeout: 60000 },
              );

              // pdftoppm appends page number to filename
              const generatedFiles = fs.readdirSync(tmpDir).filter(
                (f) => f.startsWith(`page-${pageNum}`) && f.endsWith('.png'),
              );

              if (generatedFiles.length > 0) {
                const fullImgPath = path.join(tmpDir, generatedFiles[0]);

                // Get image dimensions using identify or file command
                try {
                  const sizeOutput = execSync(
                    `identify -format "%w %h" "${fullImgPath}" 2>/dev/null || file "${fullImgPath}"`,
                    { encoding: 'utf-8', timeout: 10000 },
                  ).trim();
                  const parts = sizeOutput.split(' ');
                  if (parts.length >= 2) {
                    width = parseInt(parts[0]) || null;
                    height = parseInt(parts[1]) || null;
                  }
                } catch (e) {
                  // Dimensions are optional
                }

                // Upload full image
                const imgStoragePath = `${storagePrefix}/sheets/page-${pageNum}.png`;
                await this.storageService.uploadFile(fullImgPath, imgStoragePath);
                imagePath = imgStoragePath;

                // Generate thumbnail (300px wide)
                const thumbPath = path.join(tmpDir, `thumb-${pageNum}.png`);
                try {
                  execSync(
                    `convert "${fullImgPath}" -resize 300x -quality 80 "${thumbPath}" 2>/dev/null || cp "${fullImgPath}" "${thumbPath}"`,
                    { timeout: 30000 },
                  );
                  const thumbStoragePath = `${storagePrefix}/thumbnails/page-${pageNum}.png`;
                  await this.storageService.uploadFile(thumbPath, thumbStoragePath);
                  thumbnailPath = thumbStoragePath;
                } catch (e) {
                  // Thumbnail generation is optional
                  thumbnailPath = imagePath;
                }
              }
            } catch (e) {
              this.logger.warn(`Failed to process page ${pageNum} image: ${e.message}`);
            }
          }

          // Get page dimensions from PDF
          const page = pdfDoc.getPage(i);
          const pageSize = page.getSize();

          // Create Sheet record
          await this.prisma.sheet.create({
            data: {
              blueprintId,
              pageNumber: pageNum,
              sheetName: `Sheet ${pageNum}`,
              sheetType: 'OTHER',
              imagePath,
              thumbnailPath,
              width: width || Math.round(pageSize.width),
              height: height || Math.round(pageSize.height),
              dpi: 150,
            },
          });
        }
      } finally {
        // Clean up temp directory
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }

      // Update status to READY
      await this.prisma.blueprint.update({
        where: { id: blueprintId },
        data: { status: 'READY' },
      });

      this.logger.log(`Blueprint ${blueprintId} processing complete: ${pageCount} sheets`);
    } catch (error) {
      this.logger.error(`Failed to process blueprint ${blueprintId}: ${error.message}`);
      await this.prisma.blueprint.update({
        where: { id: blueprintId },
        data: {
          status: 'ERROR',
          errorMessage: error.message,
        },
      });
    }
  }

  private checkPoppler(): boolean {
    try {
      execSync('which pdftoppm', { encoding: 'utf-8' });
      return true;
    } catch {
      this.logger.warn('pdftoppm not found — install poppler-utils for image generation');
      return false;
    }
  }
}
