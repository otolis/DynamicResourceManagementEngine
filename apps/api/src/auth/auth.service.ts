import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, LoginResponseDto, UserResponseDto } from './dto';

export interface JwtPayload {
    sub: string; // userId
    tenantId: string;
    email: string;
    roles: string[];
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

@Injectable()
export class AuthService {
    private readonly bcryptRounds = 12;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Validate user credentials and return user if valid.
     */
    async validateUser(
        email: string,
        password: string,
        tenantId: string,
    ): Promise<UserResponseDto | null> {
        const user = await this.prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email } },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return null;
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.userRoles.map((ur) => ur.role.name),
        };
    }

    /**
     * Generate access and refresh tokens for authenticated user.
     */
    async login(user: UserResponseDto): Promise<TokenPair> {
        const payload: JwtPayload = {
            sub: user.id,
            tenantId: user.tenantId,
            email: user.email,
            roles: user.roles,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET') || '',
            expiresIn: 900, // 15 minutes in seconds
        });

        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || '';
        const refreshToken = this.jwtService.sign(
            { sub: user.id, tenantId: user.tenantId },
            {
                secret: refreshSecret,
                expiresIn: 604800, // 7 days in seconds
            },
        );

        // Store hashed refresh token for revocation capability
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes in seconds
        };
    }

    /**
     * Refresh access token using refresh token.
     */
    async refreshTokens(refreshToken: string): Promise<TokenPair> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });

            if (!user || !user.isActive || !user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Verify refresh token matches stored hash
            const tokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!tokenValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const userResponse: UserResponseDto = {
                id: user.id,
                tenantId: user.tenantId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: user.userRoles.map((ur) => ur.role.name),
            };

            // Generate new token pair (refresh token rotation)
            return this.login(userResponse);
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Invalidate refresh token for logout.
     */
    async logout(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    /**
     * Hash a password for storage.
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.bcryptRounds);
    }
}
