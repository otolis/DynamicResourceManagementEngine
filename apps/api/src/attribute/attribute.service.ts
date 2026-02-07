import {
    Injectable,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { Attribute } from '@prisma/client';
import { AttributeRepository } from './attribute.repository';
import {
    CreateAttributeDto,
    UpdateAttributeDto,
    SearchAttributeDto,
    AttributeResponseDto,
    AttributeListResponseDto,
    BulkCreateAttributeDto,
    BulkCreateAttributeResponseDto,
    CreateAttributeOptionDto,
    UpdateAttributeOptionDto,
    AttributeOptionResponseDto,
} from './dto';
import { DataType } from './enums/data-type.enum';
import {
    validateDefaultValue,
    validateValidationRules,
} from './validators';

/**
 * Service layer for Attribute business logic.
 * Handles validation, orchestration, and data transformation.
 */
@Injectable()
export class AttributeService {
    constructor(private readonly repository: AttributeRepository) {}

    /**
     * Create a new attribute.
     * Validates data type-specific fields before creating.
     */
    async create(dto: CreateAttributeDto): Promise<AttributeResponseDto> {
        // Validate dataType-specific fields
        this.validateDataTypeFields(dto);

        // Validate defaultValue matches dataType
        if (dto.defaultValue !== undefined) {
            const errors = validateDefaultValue(dto.dataType, dto.defaultValue);
            if (errors.length > 0) {
                throw new BadRequestException(errors.join('; '));
            }
        }

        // Validate validationRules structure
        if (dto.validationRules) {
            const errors = validateValidationRules(
                dto.dataType,
                dto.validationRules,
            );
            if (errors.length > 0) {
                throw new BadRequestException(errors.join('; '));
            }
        }

        // Check uniqueness within entity type
        const exists = await this.repository.existsByName(
            dto.entityTypeId,
            dto.name,
        );
        if (exists) {
            throw new ConflictException(
                `Attribute "${dto.name}" already exists for this entity type`,
            );
        }

        const attribute = await this.repository.create(dto);
        return this.mapToResponse(attribute);
    }

    /**
     * Validate that required fields for specific data types are provided.
     */
    private validateDataTypeFields(dto: CreateAttributeDto): void {
        if (dto.dataType === DataType.RELATION && !dto.relatedEntityTypeId) {
            throw new BadRequestException(
                'relatedEntityTypeId is required for RELATION type',
            );
        }

        if (
            dto.dataType === DataType.ENUM &&
            (!dto.options || dto.options.length === 0)
        ) {
            throw new BadRequestException(
                'At least one option is required for ENUM type',
            );
        }

        if (dto.dataType !== DataType.ENUM && dto.options) {
            throw new BadRequestException(
                'options can only be provided for ENUM type',
            );
        }

        if (
            dto.dataType !== DataType.RELATION &&
            dto.relatedEntityTypeId
        ) {
            throw new BadRequestException(
                'relatedEntityTypeId can only be provided for RELATION type',
            );
        }
    }

    /**
     * Find all attributes with pagination and filtering.
     */
    async findAll(
        searchDto: SearchAttributeDto,
    ): Promise<AttributeListResponseDto> {
        const { data, total } = await this.repository.findAll(searchDto);

        const page = searchDto.page || 1;
        const limit = searchDto.limit || 10;

        return {
            data: data.map((attribute) => this.mapToResponse(attribute)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find attribute by ID.
     */
    async findById(id: string): Promise<AttributeResponseDto> {
        const attribute = await this.repository.findById(id);
        return this.mapToResponse(attribute);
    }

    /**
     * Update attribute.
     * If name is being changed, validates uniqueness.
     */
    async update(
        id: string,
        dto: UpdateAttributeDto,
    ): Promise<AttributeResponseDto> {
        // Get existing attribute to check for name changes
        const existing = await this.repository.findById(id);

        // If name is changing, validate uniqueness
        const dtoAny = dto as any;
        if (dtoAny.name && dtoAny.name !== existing.name) {
            const exists = await this.repository.existsByName(
                existing.entityTypeId,
                dtoAny.name,
                id,
            );
            if (exists) {
                throw new ConflictException(
                    `Attribute "${dtoAny.name}" already exists for this entity type`,
                );
            }
        }

        // Validate defaultValue if changing
        if (dto.defaultValue !== undefined) {
            const errors = validateDefaultValue(
                existing.dataType as DataType,
                dto.defaultValue,
            );
            if (errors.length > 0) {
                throw new BadRequestException(errors.join('; '));
            }
        }

        // Validate validationRules if changing
        if (dto.validationRules) {
            const errors = validateValidationRules(
                existing.dataType as DataType,
                dto.validationRules,
            );
            if (errors.length > 0) {
                throw new BadRequestException(errors.join('; '));
            }
        }

        const attribute = await this.repository.update(id, dto);
        return this.mapToResponse(attribute);
    }

    /**
     * Delete attribute (only if not in use).
     */
    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    /**
     * Bulk create attributes.
     * Implements partial success pattern.
     */
    async bulkCreate(
        dto: BulkCreateAttributeDto,
    ): Promise<BulkCreateAttributeResponseDto> {
        const created: AttributeResponseDto[] = [];
        const failed: BulkCreateAttributeResponseDto['failed'] = [];

        for (let i = 0; i < dto.attributes.length; i++) {
            try {
                const result = await this.create(dto.attributes[i]);
                created.push(result);
            } catch (error) {
                failed.push({
                    index: i,
                    data: dto.attributes[i],
                    error: error.message || 'Unknown error',
                });
            }
        }

        return {
            created,
            failed,
            summary: {
                total: dto.attributes.length,
                successful: created.length,
                failed: failed.length,
            },
        };
    }

    /**
     * Add option to ENUM attribute.
     */
    async addOption(
        attributeId: string,
        dto: CreateAttributeOptionDto,
    ): Promise<AttributeOptionResponseDto> {
        const option = await this.repository.addOption(
            attributeId,
            dto.value,
            dto.displayName,
            dto.sortOrder,
            dto.isActive,
        );

        return {
            id: option.id,
            attributeId: option.attributeId,
            value: option.value,
            displayName: option.displayName,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
        };
    }

    /**
     * Update attribute option.
     */
    async updateOption(
        attributeId: string,
        optionId: string,
        dto: UpdateAttributeOptionDto,
    ): Promise<AttributeOptionResponseDto> {
        const option = await this.repository.updateOption(
            attributeId,
            optionId,
            dto,
        );

        return {
            id: option.id,
            attributeId: option.attributeId,
            value: option.value,
            displayName: option.displayName,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
        };
    }

    /**
     * Soft delete attribute option.
     */
    async deleteOption(
        attributeId: string,
        optionId: string,
    ): Promise<void> {
        await this.repository.deleteOption(attributeId, optionId);
    }

    /**
     * Map Prisma Attribute entity to response DTO.
     */
    private mapToResponse(attribute: any): AttributeResponseDto {
        return {
            id: attribute.id,
            tenantId: attribute.tenantId,
            entityTypeId: attribute.entityTypeId,
            name: attribute.name,
            displayName: attribute.displayName,
            description: attribute.description,
            dataType: attribute.dataType as DataType,
            isRequired: attribute.isRequired,
            isUnique: attribute.isUnique,
            isSearchable: attribute.isSearchable,
            defaultValue: attribute.defaultValue,
            validationRules: attribute.validationRules,
            sortOrder: attribute.sortOrder,
            relatedEntityTypeId: attribute.relatedEntityTypeId,
            createdAt: attribute.createdAt,
            updatedAt: attribute.updatedAt,
            options: attribute.options?.map((opt: any) => ({
                id: opt.id,
                attributeId: opt.attributeId,
                value: opt.value,
                displayName: opt.displayName,
                sortOrder: opt.sortOrder,
                isActive: opt.isActive,
            })),
        };
    }
}
