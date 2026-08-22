import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({ name: 'google-drive' })],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
