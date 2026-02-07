import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from './tenant-context.service';

/**
 * Base repository class that automatically injects tenantId into all queries.
 * This is the CRITICAL security layer that prevents cross-tenant data access.
 *
 * All repositories that access tenant-scoped data MUST extend this class.
 */
@Injectable()
export class TenantAwareRepository {
    constructor(
        protected readonly prisma: PrismaService,
        protected readonly tenantContext: TenantContextService,
    ) { }

    /**
     * Get the current tenant ID or throw if not set.
     */
    protected getTenantId(): string {
        return this.tenantContext.getTenantId();
    }

    /**
     * Inject tenantId into where clause.
     * Use this for all find operations.
     */
    protected withTenant<T extends { where?: any }>(args: T): T {
        const tenantId = this.getTenantId();
        return {
            ...args,
            where: {
                ...args.where,
                tenantId,
            },
        };
    }

    /**
     * Inject tenantId into data for create operations.
     */
    protected withTenantData<T extends { data?: any }>(args: T): T {
        const tenantId = this.getTenantId();
        return {
            ...args,
            data: {
                ...args.data,
                tenantId,
            },
        };
    }

    /**
     * Validate that a record belongs to the current tenant.
     * Use this after fetching a record by ID to ensure tenant isolation.
     */
    protected validateTenantOwnership(record: { tenantId: string } | null): void {
        if (!record) {
            return;
        }

        const currentTenantId = this.getTenantId();
        if (record.tenantId !== currentTenantId) {
            throw new ForbiddenException('Access denied');
        }
    }
}
