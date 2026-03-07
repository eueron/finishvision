import { Module } from '@nestjs/common';
import { AssemblyController } from './assembly.controller';
import { AssemblyService } from './assembly.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssemblyController],
  providers: [AssemblyService],
  exports: [AssemblyService],
})
export class AssemblyModule {}
