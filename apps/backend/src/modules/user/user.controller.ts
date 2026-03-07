import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CurrentUser, JwtPayload, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.userService.findAllByCompany(user.companyId);
  }

  @Post('invite')
  @Roles('OWNER', 'ADMIN')
  async invite(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { email: string; firstName: string; lastName: string; role: string },
  ) {
    return this.userService.inviteUser(user.companyId, dto);
  }

  @Patch(':id/deactivate')
  @Roles('OWNER', 'ADMIN')
  async deactivate(
    @CurrentUser() user: JwtPayload,
    @Param('id') userId: string,
  ) {
    return this.userService.deactivateUser(user.companyId, userId);
  }
}
