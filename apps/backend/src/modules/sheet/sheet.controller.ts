import {
  Controller, Get, Patch, Param, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SheetService } from './sheet.service';
import { UpdateSheetDto } from './dto';
import { CurrentUser, JwtPayload } from '../../common/decorators';

@Controller('sheets')
@UseGuards(AuthGuard('jwt'))
export class SheetController {
  constructor(private sheetService: SheetService) {}

  @Get('blueprint/:blueprintId')
  async findByBlueprint(
    @Param('blueprintId') blueprintId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sheetService.findByBlueprint(blueprintId, user.companyId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sheetService.findOne(id, user.companyId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSheetDto,
  ) {
    return this.sheetService.update(id, user.companyId, dto);
  }

  @Patch(':id/scale')
  async updateScale(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { scaleText: string; scaleFactor: number },
  ) {
    return this.sheetService.updateScale(id, user.companyId, body.scaleText, body.scaleFactor);
  }
}
