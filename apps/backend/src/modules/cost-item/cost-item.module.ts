import { Module } from '@nestjs/common';
import { CostItemController } from './cost-item.controller';
import { CostItemService } from './cost-item.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CostItemController],
  providers: [CostItemService],
  exports: [CostItemService],
})
export class CostItemModule {}
