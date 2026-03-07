import { Module } from '@nestjs/common';
import { TakeoffCategoryController } from './takeoff-category.controller';
import { TakeoffCategoryService } from './takeoff-category.service';

@Module({
  controllers: [TakeoffCategoryController],
  providers: [TakeoffCategoryService],
  exports: [TakeoffCategoryService],
})
export class TakeoffCategoryModule {}
