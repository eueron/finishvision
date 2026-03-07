import { Module } from '@nestjs/common';
import { LaborRateController } from './labor-rate.controller';
import { LaborRateService } from './labor-rate.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LaborRateController],
  providers: [LaborRateService],
  exports: [LaborRateService],
})
export class LaborRateModule {}
