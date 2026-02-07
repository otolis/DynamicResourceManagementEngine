import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantResolverMiddleware } from './tenant-resolver.middleware';
import { TenantAwareRepository } from './tenant-aware.repository';

@Global()
@Module({
    providers: [TenantContextService, TenantResolverMiddleware, TenantAwareRepository],
    exports: [TenantContextService, TenantAwareRepository],
})
export class TenantModule { }
