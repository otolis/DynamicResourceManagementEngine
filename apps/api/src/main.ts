import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Disable X-Powered-By header
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);

  // ==========================================================================
  // SECURITY: Helmet - HTTP Security Headers
  // ==========================================================================
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // Cross-Origin policies
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      // DNS prefetch control
      dnsPrefetchControl: { allow: false },
      // Expect-CT header for Certificate Transparency
      // Frameguard prevents clickjacking
      frameguard: { action: 'deny' },
      // Hide X-Powered-By
      hidePoweredBy: true,
      // HSTS - only in production
      hsts:
        configService.get('NODE_ENV') === 'production'
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
      // Prevents MIME type sniffing
      noSniff: true,
      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // XSS Filter
      xssFilter: true,
    }),
  );

  // ==========================================================================
  // SECURITY: CORS Configuration
  // ==========================================================================
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
    'http://localhost:5173',
  ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.) in dev
      if (!origin && configService.get('NODE_ENV') !== 'production') {
        return callback(null, true);
      }
      if (corsOrigins.includes(origin || '')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-Id',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
    credentials: true, // Required for HttpOnly cookies
    maxAge: 86400, // Pre-flight cache for 24 hours
  });

  // ==========================================================================
  // VALIDATION: Global Validation Pipe
  // ==========================================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on extra properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Require explicit type conversion
      },
      disableErrorMessages: configService.get('NODE_ENV') === 'production', // Hide details in prod
    }),
  );

  // ==========================================================================
  // STARTUP
  // ==========================================================================
  const port = configService.get<number>('API_PORT') || 3000;

  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV')}`);
  logger.log(`CORS origins: ${corsOrigins.join(', ')}`);
}

bootstrap();
