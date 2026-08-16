import { Controller, Post, Headers, UnauthorizedException, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { SyntheticsService } from './synthetics.service';

@Controller('internal/synthetics')
export class SyntheticsController {
  constructor(private readonly syntheticsService: SyntheticsService) {}

  private validateToken(token?: string) {
    const expected = process.env.SYNTHETIC_TEST_SECRET || 'dev-synthetic-secret';
    // Use a timing-safe comparison in production, but direct match is fine for now
    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid synthetic test secret');
    }
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runSynthetics(@Headers('x-synthetic-secret') token?: string) {
    this.validateToken(token);
    
    // The service handles all the try/catch isolation to ensure the API never crashes
    return this.syntheticsService.runSuite();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return { status: 'ok', synthetics: 'enabled' };
  }
}
