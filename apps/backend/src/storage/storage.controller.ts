import { Controller, Get, Param, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('storage')
@UseGuards(AuthGuard('jwt'))
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get('files/*')
  async serveFile(@Param() params: any, @Res() res: Response) {
    // Extract the full path from wildcard
    const storagePath = decodeURIComponent(params[0] || params['0'] || '');
    if (!storagePath) throw new NotFoundException('File path required');

    const file = this.storageService.getFileStream(storagePath);
    if (!file) throw new NotFoundException('File not found');

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    file.stream.pipe(res);
  }
}
