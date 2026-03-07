import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnnotationService } from './annotation.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class AnnotationController {
  constructor(private annotationService: AnnotationService) {}

  @Get('sheets/:sheetId/annotations')
  async findBySheet(
    @Param('sheetId') sheetId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.annotationService.findBySheet(sheetId, user.companyId);
  }

  @Post('sheets/:sheetId/annotations')
  async create(
    @Param('sheetId') sheetId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAnnotationDto,
  ) {
    return this.annotationService.create(sheetId, user.sub, user.companyId, dto);
  }

  @Patch('annotations/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAnnotationDto,
  ) {
    return this.annotationService.update(id, user.companyId, dto);
  }

  @Delete('annotations/:id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.annotationService.remove(id, user.companyId);
  }
}
