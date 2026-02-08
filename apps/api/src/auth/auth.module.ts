import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, GoogleStrategy, GithubStrategy } from './strategies';
import { JwtAuthGuard, GoogleOAuthGuard, GithubAuthGuard } from './guards';
import { EmailService } from './email.service';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                if (!secret) {
                    throw new Error('JWT_SECRET environment variable is required');
                }
                return {
                    secret,
                    signOptions: {
                        expiresIn: 900, // 15 minutes in seconds
                    },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService, 
        JwtStrategy, 
        GoogleStrategy, 
        GithubStrategy, 
        JwtAuthGuard, 
        GoogleOAuthGuard,
        GithubAuthGuard,
        EmailService
    ],
    exports: [AuthService, JwtAuthGuard, GoogleOAuthGuard, GithubAuthGuard, EmailService],
})
export class AuthModule { }
