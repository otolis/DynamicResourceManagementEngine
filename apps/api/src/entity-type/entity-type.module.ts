import { Module } from '@nestjs/common';
import { EntityTypeController } from './entity-type.controller';
import { EntityTypeService } from './entity-type.service';
import { EntityTypeRepository } from './entity-type.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';

/**
 * EntityType module for managing dynamic entity type definitions.
 * Provides full CRUD operations with tenant isolation and RBAC enforcement.
 */
@Module({
    imports: [PrismaModule, TenantModule],
    controllers: [EntityTypeController],
    providers: [EntityTypeService, EntityTypeRepository],
    exports: [EntityTypeService, EntityTypeRepository],
})
export class EntityTypeModule {}
