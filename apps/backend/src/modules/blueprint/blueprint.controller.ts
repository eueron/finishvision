import {
  Controller, Get, Post, Delete, Param, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlueprintService } from './blueprint.service';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller('projects/:projectId/blueprints')
@UseGuards(AuthGuard('jwt'))
export class BlueprintController {
  constructor(private blueprintService: BlueprintService) {}

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.blueprintService.findAll(projectId, user.companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.blueprintService.findOne(id, user.companyId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  }))
  async upload(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.blueprintService.upload(projectId, user.companyId, user.sub, file);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.blueprintService.remove(id, user.companyId);
  }

  @Get(':id/sheets/:sheetId/image')
  async getSheetImage(
    @Param('sheetId') sheetId: string,
    @CurrentUser() user: JwtPayload,
    @Query('type') type: 'image' | 'thumbnail',
  ) {
    const url = await this.blueprintService.getSheetImage(sheetId, user.companyId, type || 'image');
    return { url };
  }
}
