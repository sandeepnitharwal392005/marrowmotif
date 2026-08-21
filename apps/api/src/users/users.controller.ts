import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: any) {
    return this.usersService.findAll(pagination, user);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.usersService.getStats(user);
  }

  @Get('search')
  search(@Query() pagination: PaginationDto, @CurrentUser() user: any) {
    return this.usersService.search(pagination.q || '', pagination, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user);
  }

  @Public()
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.usersService.update(id, body, user);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() body: any) {
    return this.usersService.verifyOtp(body.email, body.otpCode);
  }

  @Public()
  @Post('resend-otp')
  resendOtp(@Body() body: any) {
    return this.usersService.resendOtp(body.email);
  }

  @Post('guides')
  @Roles(Role.ADMIN)
  createGuide(@Body() body: any) {
    // To be implemented in users.service.ts
    return this.usersService.createGuide(body);
  }

  @Post('referrals')
  @Roles(Role.GUIDE)
  referCustomer(@Body() body: any, @CurrentUser() user: any) {
    // To be implemented in users.service.ts
    return this.usersService.referCustomer(body, user.id);
  }

  @Public()
  @Post('setup')
  setupAccount(@Body() body: any) {
    return this.usersService.setupAccount(body.token, body.password);
  }
}
