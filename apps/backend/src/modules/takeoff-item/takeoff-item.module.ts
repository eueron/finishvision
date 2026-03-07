import { Module } from '@nestjs/common';
import { TakeoffItemController } from './takeoff-item.controller';
import { TakeoffItemService } from './takeoff-item.service';

@Module({
  controllers: [TakeoffItemController],
  providers: [TakeoffItemService],
  exports: [TakeoffItemService],
})
export class TakeoffItemModule {}
