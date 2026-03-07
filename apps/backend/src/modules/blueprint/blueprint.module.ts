import { Module } from '@nestjs/common';
import { BlueprintController } from './blueprint.controller';
import { BlueprintService } from './blueprint.service';
import { PdfProcessorService } from './pdf-processor.service';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [BlueprintController],
  providers: [BlueprintService, PdfProcessorService],
  exports: [BlueprintService],
})
export class BlueprintModule {}
