import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { PrismaModule } from '../../config/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ReportController],
  providers: [ReportService, PdfGeneratorService],
  exports: [ReportService],
})
export class ReportModule {}
