import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    const missing = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'].filter(
      (key) => !process.env[key],
    );
    if (missing.length) {
      throw new Error(
        `Missing required production environment variables: ${missing.join(', ')}`,
      );
    }
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.use(helmet());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port);
  console.log(
    `🚀 API running on port ${port} with CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`,
  );
  console.log(
    `📦 Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`,
  );
}

bootstrap();
