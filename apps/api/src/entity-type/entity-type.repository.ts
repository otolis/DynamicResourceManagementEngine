import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { TenantAwareRepository } from '../tenant/tenant-aware.repository';
import {
    CreateEntityTypeDto,
    UpdateEntityTypeDto,
    SearchEntityTypeDto,
} from './dto';
import { EntityType, Prisma } from '@prisma/client';

/**
 * Repository for EntityType with automatic tenant isolation.
 * All database operations are automatically scoped to the current tenant.
 */
@Injectable()
export class EntityTypeRepository extends TenantAwareRepository {
    constructor(
        protected readonly prisma: PrismaService,
        protected readonly tenantContext: TenantContextService,
    ) {
        super(prisma, tenantContext);
    }

    /**
     * Create a new entity type with automatic tenant isolation.
     * Handles unique constraint violations (tenantId, name).
     */
    async create(data: CreateEntityTypeDto): Promise<EntityType> {
        try {
            return await this.prisma.entityType.create({
                data: {
                    tenantId: this.getTenantId(),
                    name: data.name,
                    displayName: data.displayName,
                    description: data.description,
                    iconName: data.iconName,
                    isActive: data.isActive ?? true,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException(
                        `Entity type with name "${data.name}" already exists in this tenant`,
                    );
                }
            }
            throw error;
        }
    }

    /**
     * Find all entity types for current tenant with pagination and filtering.
     * Supports full-text search across name, displayName, and description.
     */
    async findAll(searchDto: SearchEntityTypeDto): Promise<{
        data: EntityType[];
        total: number;
    }> {
        const { search, isActive, sortBy, sortOrder, page, limit } = searchDto;

        const where: Prisma.EntityTypeWhereInput = {
            tenantId: this.getTenantId(),
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { displayName: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const orderBy: Prisma.EntityTypeOrderByWithRelationInput = sortBy
            ? { [sortBy]: sortOrder || 'asc' }
            : { createdAt: 'desc' };

        const skip = ((page || 1) - 1) * (limit || 10);
        const take = limit || 10;

        const [data, total] = await Promise.all([
            this.prisma.entityType.findMany({
                where,
                orderBy,
                skip,
                take,
            }),
            this.prisma.entityType.count({ where }),
        ]);

        return { data, total };
    }

    /**
     * Find entity type by ID with tenant ownership validation.
     * Throws NotFoundException if not found or ForbiddenException if wrong tenant.
     */
    async findById(id: string): Promise<EntityType> {
        const entityType = await this.prisma.entityType.findUnique({
            where: { id },
        });

        if (!entityType) {
            throw new NotFoundException(`Entity type with ID "${id}" not found`);
        }

        // Critical security check: validate tenant ownership
        this.validateTenantOwnership(entityType);
        return entityType;
    }

    /**
     * Find entity type with relation counts (attributes, instances, workflows).
     */
    async findByIdWithRelations(id: string): Promise<
        EntityType & {
            _count: {
                attributes: number;
                instances: number;
                workflows: number;
            };
        }
    > {
        const entityType = await this.prisma.entityType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        attributes: true,
                        instances: true,
                        workflows: true,
                    },
                },
            },
        });

        if (!entityType) {
            throw new NotFoundException(`Entity type with ID "${id}" not found`);
        }

        // Critical security check: validate tenant ownership
        this.validateTenantOwnership(entityType);
        return entityType;
    }

    /**
     * Update entity type with tenant ownership validation.
     * Handles unique constraint violations if name is changed.
     */
    async update(id: string, data: UpdateEntityTypeDto): Promise<EntityType> {
        // Validate ownership first
        await this.findById(id);

        try {
            const updateData: Prisma.EntityTypeUpdateInput = {};
            const dtoAny = data as any;

            if (dtoAny.name !== undefined) updateData.name = dtoAny.name;
            if (dtoAny.displayName !== undefined)
                updateData.displayName = dtoAny.displayName;
            if (dtoAny.description !== undefined)
                updateData.description = dtoAny.description;
            if (dtoAny.iconName !== undefined)
                updateData.iconName = dtoAny.iconName;
            if (dtoAny.isActive !== undefined)
                updateData.isActive = dtoAny.isActive;

            return await this.prisma.entityType.update({
                where: { id },
                data: updateData,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException(
                        `Entity type with name "${(data as any).name}" already exists in this tenant`,
                    );
                }
            }
            throw error;
        }
    }

    /**
     * Soft delete entity type by setting isActive to false.
     * Does NOT hard delete to preserve referential integrity and audit trail.
     */
    async softDelete(id: string): Promise<EntityType> {
        // Validate ownership first
        await this.findById(id);

        return await this.prisma.entityType.update({
            where: { id },
            data: { isActive: false },
        });
    }

    /**
     * Check if entity type name exists for current tenant.
     * Used for uniqueness validation before create/update.
     */
    async existsByName(name: string, excludeId?: string): Promise<boolean> {
        const count = await this.prisma.entityType.count(
            this.withTenant({
                where: {
                    name,
                    ...(excludeId && { id: { not: excludeId } }),
                },
            }),
        );
        return count > 0;
    }

    /**
     * Count entity types for current tenant with optional filters.
     */
    async count(where?: Prisma.EntityTypeWhereInput): Promise<number> {
        return this.prisma.entityType.count(
            this.withTenant({ where: where || {} }),
        );
    }
}
