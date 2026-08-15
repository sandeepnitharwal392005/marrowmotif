import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PictureBooksController } from './picture-books.controller';
import { PictureBooksService } from './picture-books.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'google-drive',
    }),
  ],
  controllers: [PictureBooksController],
  providers: [PictureBooksService],
  exports: [PictureBooksService],
})
export class PictureBooksModule {}
