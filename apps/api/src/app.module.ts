import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PictureBooksModule } from './picture-books/picture-books.module';
import { ProductsModule } from './products/products.module';
import { ContactModule } from './contact/contact.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SettingsModule } from './settings/settings.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { LoggerModule } from 'nestjs-pino';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from './audit/audit.module';
import { IncidentsModule } from './incidents/incidents.module';
import { SyntheticsModule } from './synthetics/synthetics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 20 },
      { name: 'long', ttl: 3600000, limit: 200 },
    ]),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PictureBooksModule,
    ProductsModule,
    ContactModule,
    WebhooksModule,
    SettingsModule,
    WhatsAppModule,
    AuditModule,
    IncidentsModule,
    SyntheticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
