import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

/**
 * Registration DTO with strong password validation.
 * Password requirements aligned with OWASP guidelines:
 * - Minimum 12 characters
 * - At least one uppercase, lowercase, number, and special character
 * - Maximum 128 characters (prevent bcrypt DoS)
 */
export class RegisterDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @IsString()
    @MinLength(12, { message: 'Password must be at least 12 characters long' })
    @MaxLength(128, { message: 'Password must not exceed 128 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&amp;#^()_\-+=\[\]{}|\\:;"'<>,.\/~`])/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @IsString()
    @MinLength(1, { message: 'First name is required' })
    @MaxLength(100)
    firstName: string;

    @IsString()
    @MinLength(1, { message: 'Last name is required' })
    @MaxLength(100)
    lastName: string;

    @IsString()
    @IsOptional()
    tenantSlug?: string; // Optional - if not provided, will use header
}

/**
 * Response after successful registration.
 */
export class RegisterResponseDto {
    message: string;
    userId: string;
    email: string;
    requiresVerification: boolean;
}

/**
 * Email verification request.
 */
export class VerifyEmailDto {
    @IsString()
    token: string;
}

/**
 * Forgot password request.
 */
export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

/**
 * Reset password with token.
 */
export class ResetPasswordDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(12, { message: 'Password must be at least 12 characters long' })
    @MaxLength(128, { message: 'Password must not exceed 128 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&amp;#^()_\-+=\[\]{}|\\:;"'<>,.\/~`])/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    newPassword: string;
}
