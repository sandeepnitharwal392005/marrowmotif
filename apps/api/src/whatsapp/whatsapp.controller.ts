import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('whatsapp')
@UseGuards(RolesGuard)
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('send-custom/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  sendCustom(
    @Param('id') id: string,
    @Body('message') message: string,
    @CurrentUser() user: any,
  ) {
    return this.whatsappService.sendCustom(id, message, user);
  }
}
