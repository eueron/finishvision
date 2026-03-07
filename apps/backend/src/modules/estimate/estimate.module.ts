import { Module } from '@nestjs/common';
import { EstimateController } from './estimate.controller';
import { EstimateService } from './estimate.service';
import { AssemblyModule } from '../assembly/assembly.module';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule, AssemblyModule],
  controllers: [EstimateController],
  providers: [EstimateService],
  exports: [EstimateService],
})
export class EstimateModule {}
