import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { envConfig } from './config/env.config';
import { PrismaModule } from './config/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { BuildingModule } from './modules/building/building.module';
import { FloorModule } from './modules/floor/floor.module';
import { UnitModule } from './modules/unit/unit.module';
import { RoomModule } from './modules/room/room.module';
import { BlueprintModule } from './modules/blueprint/blueprint.module';
import { SheetModule } from './modules/sheet/sheet.module';
import { AnnotationModule } from './modules/annotation/annotation.module';
import { TakeoffCategoryModule } from './modules/takeoff-category/takeoff-category.module';
import { TakeoffItemModule } from './modules/takeoff-item/takeoff-item.module';
import { CostItemModule } from './modules/cost-item/cost-item.module';
import { LaborRateModule } from './modules/labor-rate/labor-rate.module';
import { AssemblyModule } from './modules/assembly/assembly.module';
import { EstimateModule } from './modules/estimate/estimate.module';
import { ReportModule } from './modules/report/report.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Core
    PrismaModule,
    StorageModule,

    // Feature modules
    AuthModule,
    CompanyModule,
    UserModule,
    ProjectModule,
    BuildingModule,
    FloorModule,
    UnitModule,
    RoomModule,
    BlueprintModule,
    SheetModule,
    AnnotationModule,
    TakeoffCategoryModule,
    TakeoffItemModule,
    CostItemModule,
    LaborRateModule,
    AssemblyModule,
    EstimateModule,
    ReportModule,
    AiEngineModule,
  ],
})
export class AppModule {}
