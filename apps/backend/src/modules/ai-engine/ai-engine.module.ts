import { Module } from '@nestjs/common';
import { AiEngineController } from './ai-engine.controller';
import { AiEngineService } from './ai-engine.service';
import { OcrService } from './ocr.service';
import { VisionService } from './vision.service';
import { PrismaModule } from '../../config/prisma.module';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [AiEngineController],
  providers: [AiEngineService, OcrService, VisionService],
  exports: [AiEngineService],
})
export class AiEngineModule {}
