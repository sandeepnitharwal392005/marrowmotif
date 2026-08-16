import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PictureBooksService } from '../picture-books/picture-books.service';
import { Role } from '@prisma/client';

const SYNTHETIC_EMAIL = 'production-test@morrowotif.internal';

@Injectable()
export class SyntheticsService {
  private readonly logger = new Logger(SyntheticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pictureBooksService: PictureBooksService,
  ) {}

  async runSuite() {
    const startTime = Date.now();
    let status = 'failed';
    let errorMsg = null;

    try {
      this.logger.log('🧪 Starting Synthetic E2E Suite...');
      
      const user = await this.bootstrapIdentity();
      await this.runPictureBookFlow(user);
      
      status = 'success';
      this.logger.log('✅ Synthetic E2E Suite passed successfully.');
    } catch (error: any) {
      this.logger.error(`❌ Synthetic Suite failed: ${error.message}`);
      errorMsg = error.message;
      // We purposefully throw a 500 here so the external monitoring ping fails and fires an alert.
      throw new InternalServerErrorException(`Synthetic Test Failed: ${errorMsg}`);
    } finally {
      // Always tear down, regardless of success or failure
      await this.teardownIdentity();
      
      const duration = Date.now() - startTime;
      
      // Structured logging for datadog/cloudwatch
      this.logger.log(JSON.stringify({
        type: 'synthetic_test',
        environment: process.env.NODE_ENV || 'development',
        status,
        duration_ms: duration,
        error_class: errorMsg ? 'API_500' : null,
        error_details: errorMsg
      }));
    }

    return { status, duration_ms: Date.now() - startTime };
  }

  private async bootstrapIdentity() {
    let user = await this.prisma.user.findUnique({
      where: { email: SYNTHETIC_EMAIL }
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: SYNTHETIC_EMAIL,
          name: 'Morrowotif Synthetic Test Customer',
          whatsappNumber: '+15550000000', // Safe dummy number
          passwordHash: 'synthetic_dummy_hash_no_login_allowed',
          role: Role.END_USER,
        }
      });
    }
    return user;
  }

  private async runPictureBookFlow(user: any) {
    // 1. Create a synthetic picture book by invoking the service directly
    const book = await this.pictureBooksService.create(
      {
        title: `[SYNTHETIC] Automated Test Book ${Date.now()}`,
        deliveryPreference: 'HOME_DELIVERY',
      },
      { id: user.id, role: user.role }
    );

    if (!book || !book.id) {
      throw new Error('Failed to create synthetic picture book');
    }

    // 2. Poll DB to verify BullMQ Worker processed the jobs successfully.
    // The worker should bypass real WA/Drive and set status to UPLOAD_PENDING.
    const maxAttempts = 10;
    const delayMs = 1500;
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const checkBook = await this.prisma.pictureBook.findUnique({
        where: { id: book.id },
        select: { status: true }
      });
      
      if (checkBook?.status === 'UPLOAD_PENDING') {
        // Queue and worker are perfectly healthy!
        return;
      }
      if (checkBook?.status === 'CANCELLED') {
        throw new Error('Worker exhausted retries and marked book as CANCELLED');
      }
    }

    throw new Error(`Worker did not process the synthetic job within ${maxAttempts * delayMs}ms. Job might be stuck or worker is down.`);
  }

  private async teardownIdentity() {
    // ONLY delete picture books belonging strictly to the synthetic user!
    const user = await this.prisma.user.findUnique({ where: { email: SYNTHETIC_EMAIL } });
    if (user) {
      await this.prisma.pictureBook.deleteMany({
        where: { userId: user.id }
      });
    }
  }
}
