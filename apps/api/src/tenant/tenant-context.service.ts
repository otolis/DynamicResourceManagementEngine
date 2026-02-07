import { Injectable, ForbiddenException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
    tenantId: string;
}

@Injectable()
export class TenantContextService {
    private readonly asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

    /**
     * Run a function within a tenant context.
     * All database operations within this context will be scoped to this tenant.
     */
    run<T>(tenantId: string, fn: () => T): T {
        return this.asyncLocalStorage.run({ tenantId }, fn);
    }

    /**
     * Get the current tenant ID from context.
     * Throws ForbiddenException if no tenant context is set.
     */
    getTenantId(): string {
        const store = this.asyncLocalStorage.getStore();
        if (!store?.tenantId) {
            throw new ForbiddenException('Tenant context is required');
        }
        return store.tenantId;
    }

    /**
     * Get the current tenant ID or null if not set.
     * Use this for operations that may not require tenant context.
     */
    getTenantIdOrNull(): string | null {
        const store = this.asyncLocalStorage.getStore();
        return store?.tenantId ?? null;
    }
}
