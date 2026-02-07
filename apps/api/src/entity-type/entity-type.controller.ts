import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { EntityTypeService } from './entity-type.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../security/guards/rbac.guard';
import { RequirePermission } from '../security/decorators/require-permission.decorator';
import {
    CreateEntityTypeDto,
    UpdateEntityTypeDto,
    SearchEntityTypeDto,
    BulkCreateEntityTypeDto,
    EntityTypeResponseDto,
    EntityTypeListResponseDto,
    EntityTypeWithRelationsDto,
    BulkCreateResponseDto,
} from './dto';

/**
 * Controller for EntityType CRUD operations.
 * All endpoints require JWT authentication and RBAC permissions.
 */
@Controller('entity-types')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EntityTypeController {
    constructor(private readonly entityTypeService: EntityTypeService) {}

    /**
     * Create a new entity type.
     * POST /entity-types
     *
     * Requires: entityType:create permission
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission('entityType', 'create')
    async create(
        @Body() dto: CreateEntityTypeDto,
    ): Promise<EntityTypeResponseDto> {
        return this.entityTypeService.create(dto);
    }

    /**
     * Get all entity types with pagination and filtering.
     * GET /entity-types?search=project&isActive=true&page=1&limit=10&sortBy=name&sortOrder=asc
     *
     * Requires: entityType:read permission
     */
    @Get()
    @RequirePermission('entityType', 'read')
    async findAll(
        @Query() searchDto: SearchEntityTypeDto,
    ): Promise<EntityTypeListResponseDto> {
        return this.entityTypeService.findAll(searchDto);
    }

    /**
     * Get entity type by ID.
     * GET /entity-types/:id
     *
     * Requires: entityType:read permission
     */
    @Get(':id')
    @RequirePermission('entityType', 'read')
    async findById(@Param('id') id: string): Promise<EntityTypeResponseDto> {
        return this.entityTypeService.findById(id);
    }

    /**
     * Get entity type with relation counts.
     * GET /entity-types/:id/with-relations
     *
     * Requires: entityType:read permission
     */
    @Get(':id/with-relations')
    @RequirePermission('entityType', 'read')
    async findByIdWithRelations(
        @Param('id') id: string,
    ): Promise<EntityTypeWithRelationsDto> {
        return this.entityTypeService.findByIdWithRelations(id);
    }

    /**
     * Update entity type.
     * PUT /entity-types/:id
     *
     * Requires: entityType:update permission
     */
    @Put(':id')
    @RequirePermission('entityType', 'update')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEntityTypeDto,
    ): Promise<EntityTypeResponseDto> {
        return this.entityTypeService.update(id, dto);
    }

    /**
     * Soft delete entity type.
     * DELETE /entity-types/:id
     *
     * Requires: entityType:delete permission
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission('entityType', 'delete')
    async delete(@Param('id') id: string): Promise<EntityTypeResponseDto> {
        return this.entityTypeService.softDelete(id);
    }

    /**
     * Bulk create entity types.
     * POST /entity-types/bulk
     *
     * Requires: entityType:create permission
     */
    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission('entityType', 'create')
    async bulkCreate(
        @Body() dto: BulkCreateEntityTypeDto,
    ): Promise<BulkCreateResponseDto> {
        return this.entityTypeService.bulkCreate(dto);
    }
}
