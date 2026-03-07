import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto';
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('company')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  async getCompany(@CurrentUser() user: JwtPayload) {
    return this.companyService.getCompany(user.companyId);
  }

  @Patch()
  @Roles('OWNER', 'ADMIN')
  async updateCompany(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(user.companyId, dto);
  }
}
