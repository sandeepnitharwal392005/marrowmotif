import { Module } from '@nestjs/common';
import { SyntheticsController } from './synthetics.controller';
import { SyntheticsService } from './synthetics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PictureBooksModule } from '../picture-books/picture-books.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, PictureBooksModule, AuthModule],
  controllers: [SyntheticsController],
  providers: [SyntheticsService],
})
export class SyntheticsModule {}
