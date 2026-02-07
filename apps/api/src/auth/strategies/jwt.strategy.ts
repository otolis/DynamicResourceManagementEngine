import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.service';

export interface AuthenticatedUser {
    id: string;
    tenantId: string;
    email: string;
    roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    /**
     * Validate JWT payload and return user object to attach to request.
     */
    async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
        if (!payload.sub || !payload.tenantId) {
            throw new UnauthorizedException('Invalid token payload');
        }

        return {
            id: payload.sub,
            tenantId: payload.tenantId,
            email: payload.email,
            roles: payload.roles,
        };
    }
}
