import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { 
    UserResponseDto, 
    RegisterDto, 
    RegisterResponseDto,
} from './dto';
import { EmailService } from './email.service';

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
    private readonly logger = new Logger(AuthService.name);
    private readonly bcryptRounds = 12;
    private readonly maxFailedAttempts = 5;
    private readonly lockoutDurationMs = 15 * 60 * 1000; // 15 minutes
    private readonly verificationTokenExpiryMs = 24 * 60 * 60 * 1000; // 24 hours
    private readonly passwordResetExpiryMs = 60 * 60 * 1000; // 1 hour

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    /**
     * Register a new user.
     */
    async register(dto: RegisterDto, tenantId: string): Promise<RegisterResponseDto> {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: dto.email.toLowerCase() } },
        });

        if (existingUser) {
            throw new ConflictException('An account with this email already exists');
        }

        // Hash password
        const passwordHash = await this.hashPassword(dto.password);

        // Generate verification token
        const verificationToken = this.generateSecureToken();
        const verificationExpiry = new Date(Date.now() + this.verificationTokenExpiryMs);

        // Get default role for new users
        const defaultRole = await this.prisma.role.findFirst({
            where: { tenantId, name: 'user' },
        });

        // Create user
        const user = await this.prisma.user.create({
            data: {
                tenantId,
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                emailVerified: false,
                verificationToken,
                verificationExpiry,
                userRoles: defaultRole ? {
                    create: { roleId: defaultRole.id },
                } : undefined,
            },
        });

        // Send verification email
        await this.emailService.sendVerificationEmail(user.email, verificationToken);

        this.logger.log(`User registered: ${user.email} (tenant: ${tenantId})`);

        return {
            message: 'Registration successful. Please check your email to verify your account.',
            userId: user.id,
            email: user.email,
            requiresVerification: true,
        };
    }

    /**
     * Verify email address with token.
     */
    async verifyEmail(token: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findFirst({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        if (user.verificationExpiry && user.verificationExpiry < new Date()) {
            throw new BadRequestException('Verification token has expired. Please request a new one.');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationExpiry: null,
            },
        });

        this.logger.log(`Email verified: ${user.email}`);

        return { message: 'Email verified successfully. You can now log in.' };
    }

    // =========================================================================
    // PASSWORD RESET
    // =========================================================================

    /**
     * Initiate password reset.
     * Always returns success to prevent email enumeration.
     */
    async forgotPassword(email: string, tenantId: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
        });

        // Always return success to prevent email enumeration
        const successMessage = { message: 'If an account exists with this email, you will receive a password reset link.' };

        if (!user || !user.isActive) {
            return successMessage;
        }

        // Generate reset token
        const resetToken = this.generateSecureToken();
        const resetExpiry = new Date(Date.now() + this.passwordResetExpiryMs);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpiry: resetExpiry,
            },
        });

        await this.emailService.sendPasswordResetEmail(user.email, resetToken);

        this.logger.log(`Password reset requested: ${user.email}`);

        return successMessage;
    }

    /**
     * Reset password with token.
     */
    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findFirst({
            where: { passwordResetToken: token },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
            throw new BadRequestException('Reset token has expired. Please request a new one.');
        }

        const passwordHash = await this.hashPassword(newPassword);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpiry: null,
                // Clear any lockout
                failedLoginAttempts: 0,
                lockoutUntil: null,
            },
        });

        this.logger.log(`Password reset completed: ${user.email}`);

        return { message: 'Password reset successfully. You can now log in with your new password.' };
    }

    // =========================================================================
    // LOGIN / AUTHENTICATION
    // =========================================================================

    /**
     * Validate user credentials and return user if valid.
     */
    async validateUser(
        email: string,
        password: string,
        tenantId: string,
    ): Promise<UserResponseDto | null> {
        const user = await this.prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
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

        // Check account lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
        }

        // Check email verification
        if (!user.emailVerified) {
            throw new UnauthorizedException('Please verify your email address before logging in.');
        }

        if (!user.passwordHash) {
            throw new UnauthorizedException('Please sign in using your social provider or reset your password to set a local password.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
            // Increment failed attempts
            const failedAttempts = user.failedLoginAttempts + 1;
            const updateData: { failedLoginAttempts: number; lockoutUntil?: Date } = {
                failedLoginAttempts: failedAttempts,
            };

            if (failedAttempts >= this.maxFailedAttempts) {
                updateData.lockoutUntil = new Date(Date.now() + this.lockoutDurationMs);
                this.logger.warn(`Account locked due to failed attempts: ${user.email}`);
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });

            return null;
        }

        // Reset failed attempts on successful login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { 
                lastLoginAt: new Date(),
                failedLoginAttempts: 0,
                lockoutUntil: null,
            },
        });

        return this.mapToUserResponse(user);
    }

    /**
     * Validate OAuth user and return internal user representation.
     * Links account if already exists by email, or creates new one.
     */
    async validateOAuthUser(profile: {
        email: string;
        firstName?: string;
        lastName?: string;
        googleId?: string;
        githubId?: string;
        tenantId?: string;
    }): Promise<UserResponseDto> {
        const { email, firstName, lastName, googleId, githubId } = profile;
        let { tenantId } = profile;

        // 1. Try to find user by specific OAuth ID
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    googleId ? { googleId } : undefined,
                    githubId ? { githubId } : undefined,
                ].filter(Boolean) as any[],
            },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        if (user) {
            // Found by OAuth ID - ensure it's still active
            if (!user.isActive) {
                throw new UnauthorizedException('User account is deactivated');
            }
            return this.mapToUserResponse(user);
        }

        // 2. Not found by OAuth ID, try to find by email
        // If tenantId is not provided, we look for any user with this email
        // We pick the first one we find across all tenants if no tenantId specified
        const whereClause = tenantId 
            ? { tenantId, email: email.toLowerCase() } 
            : { email: email.toLowerCase() };

        user = await this.prisma.user.findFirst({
            where: whereClause,
            include: {
                userRoles: { include: { role: true } },
            },
        });

        if (user) {
            // Found by email - link the OAuth ID
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: googleId || user.googleId,
                    githubId: githubId || user.githubId,
                    emailVerified: true, // OAuth emails are considered verified
                },
                include: {
                    userRoles: { include: { role: true } },
                },
            });
            return this.mapToUserResponse(user);
        }

        // 3. Create new user
        // We need a tenantId. If none provided, we try to find the oldest active tenant.
        if (!tenantId) {
            const defaultTenant = await this.prisma.tenant.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: 'asc' },
            });
            
            if (!defaultTenant) {
                throw new BadRequestException('No tenant available for OAuth sign up');
            }
            tenantId = defaultTenant.id;
        }

        // Get default role for new users
        const defaultRole = await this.prisma.role.findFirst({
            where: { tenantId, name: 'user' },
        });

        user = await this.prisma.user.create({
            data: {
                tenantId: tenantId!,
                email: email.toLowerCase(),
                firstName,
                lastName,
                googleId,
                githubId,
                emailVerified: true,
                userRoles: defaultRole ? {
                    create: { roleId: defaultRole.id },
                } : undefined,
            },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        return this.mapToUserResponse(user);
    }

    /**
     * Map Prisma user model to UserResponseDto.
     */
    private mapToUserResponse(user: any): UserResponseDto {
        return {
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.userRoles?.map((ur: any) => ur.role.name) || [],
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
        } catch {
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

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Hash a password for storage.
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.bcryptRounds);
    }

    /**
     * Generate a cryptographically secure token.
     */
    private generateSecureToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}

