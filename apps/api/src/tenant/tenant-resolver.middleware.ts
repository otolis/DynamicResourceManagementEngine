import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
    constructor(
        private readonly tenantContext: TenantContextService,
        private readonly prisma: PrismaService,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const url = req.originalUrl || req.url;
        
        // Skip tenant resolution for all authentication routes
        if (url.includes('/auth/')) {
            return next();
        }

        const tenantIdOrSlug = await this.resolveTenantId(req);

        if (!tenantIdOrSlug) {
            throw new BadRequestException(`Tenant identification required. [Path: ${url}]`);
        }

        // Verify tenant exists and is active
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSlug);
        
        const tenant = await this.prisma.tenant.findFirst({
            where: isUuid 
                ? { id: tenantIdOrSlug, isActive: true }
                : { slug: tenantIdOrSlug, isActive: true },
            select: { id: true },
        });

        if (!tenant) {
            throw new BadRequestException('Invalid tenant');
        }

        // Run the rest of the request within tenant context using the resolved UUID
        this.tenantContext.run(tenant.id, () => {
            next();
        });
    }

    private async resolveTenantId(req: Request): Promise<string | null> {
        // Priority 1: X-Tenant-Id header (for API clients)
        const headerTenantId = req.headers['x-tenant-id'];
        if (typeof headerTenantId === 'string' && headerTenantId.length > 0) {
            return headerTenantId;
        }

        // Priority 2: Subdomain extraction (for web app)
        const host = req.headers.host;
        if (host) {
            const subdomain = this.extractSubdomain(host);
            if (subdomain) {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { slug: subdomain },
                    select: { id: true },
                });
                if (tenant) {
                    return tenant.id;
                }
            }
        }

        // Priority 3: Query parameters (for OAuth redirects and links)
        const queryTenantId = req.query.tenant || req.query.tenantId;
        if (typeof queryTenantId === 'string' && queryTenantId.length > 0) {
            return queryTenantId;
        }

        // Priority 4: JWT payload (extracted by auth guard, if available)
        const user = (req as any).user;
        if (user?.tenantId) {
            return user.tenantId;
        }

        return null;
    }

    private extractSubdomain(host: string): string | null {
        // Remove port if present
        const hostWithoutPort = host.split(':')[0];

        // Skip localhost and IP addresses
        if (
            hostWithoutPort === 'localhost' ||
            /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostWithoutPort)
        ) {
            return null;
        }

        const parts = hostWithoutPort.split('.');
        // Need at least 3 parts for subdomain (e.g., tenant.example.com)
        if (parts.length >= 3) {
            return parts[0];
        }

        return null;
    }
}
