import {
    Controller,
    Post,
    Body,
    Res,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    Headers,
    UseGuards,
} from '@nestjs/common';
import * as express from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: LoginDto,
        @Headers('x-tenant-id') tenantId: string,
        @Res({ passthrough: true }) res: express.Response,
    ): Promise<LoginResponseDto> {
        if (!tenantId) {
            throw new UnauthorizedException('Tenant identification required');
        }

        const user = await this.authService.validateUser(
            loginDto.email,
            loginDto.password,
            tenantId,
        );

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.authService.login(user);

        // Set refresh token as HttpOnly cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/auth',
        });

        return {
            user,
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
        };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Res({ passthrough: true }) res: express.Response,
        @Headers('cookie') cookieHeader: string,
    ): Promise<{ accessToken: string; expiresIn: number }> {
        // Extract refresh token from cookies
        const cookies = this.parseCookies(cookieHeader || '');
        const refreshToken = cookies['refreshToken'];

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token required');
        }

        const tokens = await this.authService.refreshTokens(refreshToken);

        // Set new refresh token (rotation)
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/auth',
        });

        return {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @CurrentUser() user: AuthenticatedUser,
        @Res({ passthrough: true }) res: express.Response,
    ): Promise<{ message: string }> {
        await this.authService.logout(user.id);

        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth',
        });

        return { message: 'Logged out successfully' };
    }

    private parseCookies(cookieHeader: string): Record<string, string> {
        const cookies: Record<string, string> = {};
        cookieHeader.split(';').forEach((cookie) => {
            const [name, ...rest] = cookie.trim().split('=');
            if (name && rest.length > 0) {
                cookies[name] = rest.join('=');
            }
        });
        return cookies;
    }
}
