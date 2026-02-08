import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as crypto from 'crypto';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Email service with Resend integration.
 * 
 * Configure in .env:
 * - RESEND_API_KEY: Your Resend API key (get from https://resend.com)
 * - EMAIL_FROM: Sender email address (must be verified in Resend)
 * - APP_URL: Frontend URL for verification/reset links
 * 
 * In development (no API key), emails are logged to console.
 */
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly appUrl: string;
    private readonly fromEmail: string;
    private readonly resend: Resend | null;

    constructor(private readonly configService: ConfigService) {
        this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:5173';
        this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@example.com';
        
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        this.resend = apiKey ? new Resend(apiKey) : null;
        
        if (!this.resend) {
            this.logger.warn('RESEND_API_KEY not configured - emails will be logged to console');
        }
    }

    /**
     * Send an email via Resend or log to console in dev mode.
     */
    async send(options: EmailOptions): Promise<boolean> {
        // In development or without API key, log emails to console
        if (!this.resend) {
            this.logger.log('========== EMAIL (DEV MODE) ==========');
            this.logger.log(`To: ${options.to}`);
            this.logger.log(`Subject: ${options.subject}`);
            this.logger.log(`Body: ${options.text || 'See HTML content'}`);
            this.logger.log('=======================================');
            return true;
        }

        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });

            if (result.error) {
                this.logger.error(`Email send failed: ${result.error.message}`);
                return false;
            }

            this.logger.log(`Email sent successfully to ${options.to} (ID: ${result.data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`Email send error: ${error}`);
            return false;
        }
    }

    /**
     * Send email verification link.
     */
    async sendVerificationEmail(email: string, token: string): Promise<boolean> {
        const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;

        return this.send({
            to: email,
            subject: 'Verify your email address',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #1a1a1a; margin-bottom: 24px;">Welcome!</h1>
                    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                        Please verify your email address by clicking the button below:
                    </p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: #6200ee; color: white; padding: 12px 24px; 
                              border-radius: 6px; text-decoration: none; font-weight: 500; margin: 24px 0;">
                        Verify Email
                    </a>
                    <p style="color: #666; font-size: 14px; margin-top: 24px;">
                        Or copy this link: <a href="${verificationUrl}" style="color: #6200ee;">${verificationUrl}</a>
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 32px;">
                        This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
            `,
            text: `Welcome! Verify your email: ${verificationUrl} (expires in 24 hours)`,
        });
    }

    /**
     * Send password reset link.
     */
    async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
        const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

        return this.send({
            to: email,
            subject: 'Reset your password',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #1a1a1a; margin-bottom: 24px;">Password Reset Request</h1>
                    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                        Click the button below to reset your password:
                    </p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: #6200ee; color: white; padding: 12px 24px; 
                              border-radius: 6px; text-decoration: none; font-weight: 500; margin: 24px 0;">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 14px; margin-top: 24px;">
                        Or copy this link: <a href="${resetUrl}" style="color: #6200ee;">${resetUrl}</a>
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 32px;">
                        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                    </p>
                </div>
            `,
            text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
        });
    }

    /**
     * Generate a cryptographically secure token.
     */
    generateSecureToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}
