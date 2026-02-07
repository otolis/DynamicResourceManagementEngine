import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { EntityTypeRepository } from './entity-type.repository';
import {
    CreateEntityTypeDto,
    UpdateEntityTypeDto,
    SearchEntityTypeDto,
    EntityTypeResponseDto,
    EntityTypeListResponseDto,
    EntityTypeWithRelationsDto,
    BulkCreateEntityTypeDto,
    BulkCreateResponseDto,
} from './dto';
import { EntityType } from '@prisma/client';

/**
 * Service layer for EntityType business logic.
 * Handles validation, orchestration, and data transformation.
 */
@Injectable()
export class EntityTypeService {
    constructor(private readonly repository: EntityTypeRepository) {}

    /**
     * Create a new entity type.
     * Validates unique name constraint before attempting database insert.
     */
    async create(dto: CreateEntityTypeDto): Promise<EntityTypeResponseDto> {
        // Business logic: Check uniqueness before attempting create
        const exists = await this.repository.existsByName(dto.name);
        if (exists) {
            throw new ConflictException(
                `Entity type with name "${dto.name}" already exists`,
            );
        }

        const entityType = await this.repository.create(dto);
        return this.mapToResponse(entityType);
    }

    /**
     * Find all entity types with pagination and filtering.
     */
    async findAll(
        searchDto: SearchEntityTypeDto,
    ): Promise<EntityTypeListResponseDto> {
        const { data, total } = await this.repository.findAll(searchDto);

        const page = searchDto.page || 1;
        const limit = searchDto.limit || 10;

        return {
            data: data.map((entity) => this.mapToResponse(entity)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find entity type by ID.
     */
    async findById(id: string): Promise<EntityTypeResponseDto> {
        const entityType = await this.repository.findById(id);
        return this.mapToResponse(entityType);
    }

    /**
     * Find entity type with relation counts.
     */
    async findByIdWithRelations(
        id: string,
    ): Promise<EntityTypeWithRelationsDto> {
        const entityType = await this.repository.findByIdWithRelations(id);
        return {
            ...this.mapToResponse(entityType),
            attributeCount: entityType._count.attributes,
            instanceCount: entityType._count.instances,
            workflowCount: entityType._count.workflows,
        };
    }

    /**
     * Update entity type.
     * If name is being changed, validates uniqueness.
     */
    async update(
        id: string,
        dto: UpdateEntityTypeDto,
    ): Promise<EntityTypeResponseDto> {
        // If name is being changed, validate uniqueness
        const dtoAny = dto as any;
        if (dtoAny.name) {
            const exists = await this.repository.existsByName(dtoAny.name, id);
            if (exists) {
                throw new ConflictException(
                    `Entity type with name "${dtoAny.name}" already exists`,
                );
            }
        }

        const entityType = await this.repository.update(id, dto);
        return this.mapToResponse(entityType);
    }

    /**
     * Soft delete entity type.
     */
    async softDelete(id: string): Promise<EntityTypeResponseDto> {
        const entityType = await this.repository.softDelete(id);
        return this.mapToResponse(entityType);
    }

    /**
     * Bulk create entity types.
     * Implements partial success pattern - some may succeed, some may fail.
     * Returns detailed results for both successful and failed operations.
     */
    async bulkCreate(
        dto: BulkCreateEntityTypeDto,
    ): Promise<BulkCreateResponseDto> {
        const created: EntityTypeResponseDto[] = [];
        const failed: BulkCreateResponseDto['failed'] = [];

        for (let i = 0; i < dto.entityTypes.length; i++) {
            try {
                const result = await this.create(dto.entityTypes[i]);
                created.push(result);
            } catch (error) {
                failed.push({
                    index: i,
                    data: dto.entityTypes[i],
                    error: error.message || 'Unknown error',
                });
            }
        }

        return {
            created,
            failed,
            summary: {
                total: dto.entityTypes.length,
                successful: created.length,
                failed: failed.length,
            },
        };
    }

    /**
     * Map Prisma EntityType entity to response DTO.
     * Ensures consistent response format across all endpoints.
     */
    private mapToResponse(entityType: EntityType): EntityTypeResponseDto {
        return {
            id: entityType.id,
            tenantId: entityType.tenantId,
            name: entityType.name,
            displayName: entityType.displayName,
            description: entityType.description,
            iconName: entityType.iconName,
            isActive: entityType.isActive,
            createdAt: entityType.createdAt,
            updatedAt: entityType.updatedAt,
        };
    }
}
