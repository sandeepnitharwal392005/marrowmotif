import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PictureBooksService } from './picture-books.service';
import { CreatePictureBookDto } from './dto/create-picture-book.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('picture-books')
@UseGuards(JwtAuthGuard)
export class PictureBooksController {
  constructor(private pictureBooksService: PictureBooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  create(@Body() dto: CreatePictureBookDto, @CurrentUser() user: any) {
    return this.pictureBooksService.create(dto, user);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: any) {
    return this.pictureBooksService.findAll(pagination, user);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.pictureBooksService.getDashboardStats(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.pictureBooksService.findOne(id, user);
  }

  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  resend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.pictureBooksService.resend(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @CurrentUser() user: any,
  ) {
    return this.pictureBooksService.updateStatus(id, status, user);
  }

  @Post(':id/drive')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  createDriveLink(@Param('id') id: string, @CurrentUser() user: any) {
    return this.pictureBooksService.createDriveLink(id, user);
  }

  @Delete('synthetic')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  cleanupSynthetic(@CurrentUser() user: any) {
    return this.pictureBooksService.cleanupSynthetic(user);
  }
}
