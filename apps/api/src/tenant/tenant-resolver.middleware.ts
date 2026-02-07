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
        const tenantId = await this.resolveTenantId(req);

        if (!tenantId) {
            throw new BadRequestException('Tenant identification required');
        }

        // Verify tenant exists and is active
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, isActive: true },
        });

        if (!tenant) {
            throw new BadRequestException('Invalid tenant');
        }

        if (!tenant.isActive) {
            throw new BadRequestException('Tenant is inactive');
        }

        // Run the rest of the request within tenant context
        this.tenantContext.run(tenantId, () => {
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

        // Priority 3: JWT payload (extracted by auth guard, if available)
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
