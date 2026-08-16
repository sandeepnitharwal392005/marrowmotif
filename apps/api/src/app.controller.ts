import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  async checkHealth() {
    let dbStatus = 'ok';
    let dbError = null;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'error';
      dbError = e.message;
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      databaseError: dbError,
      env: process.env.NODE_ENV,
      cors: process.env.CORS_ORIGIN,
    };
  }
}
