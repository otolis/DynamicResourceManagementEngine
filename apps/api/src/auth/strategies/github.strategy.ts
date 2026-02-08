import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(configService: ConfigService) {
        const clientID = configService.get<string>('GITHUB_CLIENT_ID');
        const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
        const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');

        super({
            clientID: clientID || 'missing',
            clientSecret: clientSecret || 'missing',
            callbackURL: callbackURL || 'http://localhost:3000/auth/github/callback',
            scope: ['user:email'],
            passReqToCallback: true,
        });
    }

    async validate(
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err: any, user?: any) => void,
    ): Promise<any> {
        const { displayName, emails, id, username } = profile;
        const user = {
            githubId: id.toString(),
            email: emails?.[0]?.value || `${username}@github.com`,
            firstName: displayName || username,
            lastName: '',
            accessToken,
            // Extract tenantId from state if provided
            tenantId: req.query.state || null,
        };
        done(null, user);
    }
}
