import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { TenantResolverMiddleware } from './tenant/tenant-resolver.middleware';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SecurityModule } from './security/security.module';
import { RbacGuard } from './security/guards/rbac.guard';
import { EntityTypeModule } from './entity-type/entity-type.module';
import { AttributeModule } from './attribute/attribute.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting - protects against brute-force attacks
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('RATE_LIMIT_WINDOW_MS') || 60000,
            limit: config.get<number>('RATE_LIMIT_MAX_REQUESTS') || 100,
          },
          {
            name: 'auth',
            ttl: 60000, // 1 minute window for auth endpoints
            limit: 5, // Only 5 attempts per minute (stricter for auth)
          },
        ],
      }),
    }),
    // Core modules
    PrismaModule,
    TenantModule,
    AuthModule,
    SecurityModule,
    EntityTypeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards - applied to all routes in this order
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting first
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Then authentication
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard, // Then authorization
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant resolver to all routes except auth endpoints
    consumer
      .apply(TenantResolverMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
