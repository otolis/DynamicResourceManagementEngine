import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { Prisma, Attribute } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { TenantAwareRepository } from '../tenant/tenant-aware.repository';
import {
    CreateAttributeDto,
    UpdateAttributeDto,
    SearchAttributeDto,
} from './dto';
import { DataType } from './enums/data-type.enum';

/**
 * Repository for Attribute entity with tenant isolation.
 *
 * Key responsibilities:
 * - Validate parent EntityType ownership
 * - Handle ENUM type with AttributeOptions (transaction)
 * - Prevent deletion if attribute is in use
 * - Enforce tenant isolation on all operations
 */
@Injectable()
export class AttributeRepository extends TenantAwareRepository {
    constructor(
        protected readonly prisma: PrismaService,
        protected readonly tenantContext: TenantContextService,
    ) {
        super(prisma, tenantContext);
    }

    /**
     * Create attribute with automatic tenant injection.
     * If ENUM type and options provided, create them in transaction.
     */
    async create(data: CreateAttributeDto): Promise<Attribute> {
        const tenantId = this.getTenantId();

        // Validate parent EntityType exists and belongs to tenant
        await this.validateEntityTypeOwnership(data.entityTypeId);

        try {
            if (data.dataType === DataType.ENUM && data.options) {
                // Transaction: Create attribute + options atomically
                return await this.prisma.$transaction(async (tx) => {
                    const attribute = await tx.attribute.create({
                        data: {
                            tenantId,
                            entityTypeId: data.entityTypeId,
                            name: data.name,
                            displayName: data.displayName,
                            description: data.description,
                            dataType: data.dataType,
                            isRequired: data.isRequired ?? false,
                            isUnique: data.isUnique ?? false,
                            isSearchable: data.isSearchable ?? false,
                            defaultValue: data.defaultValue,
                            validationRules: data.validationRules,
                            sortOrder: data.sortOrder ?? 0,
                            relatedEntityTypeId: data.relatedEntityTypeId,
                        },
                    });

                    // Create options
                    await tx.attributeOption.createMany({
                        data: data.options.map((opt, index) => ({
                            attributeId: attribute.id,
                            value: opt.value,
                            displayName: opt.displayName,
                            sortOrder: opt.sortOrder ?? index,
                            isActive: opt.isActive ?? true,
                        })),
                    });

                    // Return with options included
                    return await tx.attribute.findUnique({
                        where: { id: attribute.id },
                        include: { options: true },
                    });
                });
            } else {
                // Simple create without options
                return await this.prisma.attribute.create({
                    data: {
                        tenantId,
                        entityTypeId: data.entityTypeId,
                        name: data.name,
                        displayName: data.displayName,
                        description: data.description,
                        dataType: data.dataType,
                        isRequired: data.isRequired ?? false,
                        isUnique: data.isUnique ?? false,
                        isSearchable: data.isSearchable ?? false,
                        defaultValue: data.defaultValue,
                        validationRules: data.validationRules,
                        sortOrder: data.sortOrder ?? 0,
                        relatedEntityTypeId: data.relatedEntityTypeId,
                    },
                });
            }
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException(
                        `Attribute with name "${data.name}" already exists for this entity type`,
                    );
                }
                if (error.code === 'P2003') {
                    throw new BadRequestException(
                        'Related entity type does not exist',
                    );
                }
            }
            throw error;
        }
    }

    /**
     * Validate that EntityType exists and belongs to current tenant.
     */
    private async validateEntityTypeOwnership(
        entityTypeId: string,
    ): Promise<void> {
        const entityType = await this.prisma.entityType.findUnique({
            where: { id: entityTypeId },
        });

        if (!entityType) {
            throw new NotFoundException(
                `Entity type "${entityTypeId}" not found`,
            );
        }

        this.validateTenantOwnership(entityType);
    }

    /**
     * Find all attributes with filtering and pagination.
     */
    async findAll(
        searchDto: SearchAttributeDto,
    ): Promise<{ data: Attribute[]; total: number }> {
        const where: any = {
            tenantId: this.getTenantId(),
        };

        if (searchDto.entityTypeId) {
            where.entityTypeId = searchDto.entityTypeId;
        }

        if (searchDto.dataType) {
            where.dataType = searchDto.dataType;
        }

        if (searchDto.search) {
            where.OR = [
                { name: { contains: searchDto.search, mode: 'insensitive' } },
                {
                    displayName: {
                        contains: searchDto.search,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: searchDto.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.attribute.findMany({
                where,
                include: { options: true }, // Always include options for ENUM types
                orderBy: {
                    [searchDto.sortBy || 'sortOrder']:
                        searchDto.sortOrder || 'asc',
                },
                skip: ((searchDto.page || 1) - 1) * (searchDto.limit || 10),
                take: searchDto.limit || 10,
            }),
            this.prisma.attribute.count({ where }),
        ]);

        return { data, total };
    }

    /**
     * Find attribute by ID with tenant validation.
     */
    async findById(id: string): Promise<Attribute> {
        const attribute = await this.prisma.attribute.findUnique({
            where: { id },
            include: { options: true },
        });

        if (!attribute) {
            throw new NotFoundException(`Attribute "${id}" not found`);
        }

        this.validateTenantOwnership(attribute);
        return attribute;
    }

    /**
     * Update attribute.
     */
    async update(id: string, data: UpdateAttributeDto): Promise<Attribute> {
        // Validate ownership first
        await this.findById(id);

        try {
            return await this.prisma.attribute.update({
                where: { id },
                data,
                include: { options: true },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException(
                        `Attribute with name "${data.name}" already exists for this entity type`,
                    );
                }
            }
            throw error;
        }
    }

    /**
     * Check if attribute exists by name within an entity type.
     */
    async existsByName(
        entityTypeId: string,
        name: string,
        excludeId?: string,
    ): Promise<boolean> {
        const count = await this.prisma.attribute.count({
            where: {
                tenantId: this.getTenantId(),
                entityTypeId,
                name,
                ...(excludeId && { id: { not: excludeId } }),
            },
        });
        return count > 0;
    }

    /**
     * Check if attribute is used in any EntityInstances.
     */
    async isAttributeInUse(attributeId: string): Promise<boolean> {
        const count = await this.prisma.attributeValue.count({
            where: {
                attributeId,
                tenantId: this.getTenantId(),
            },
        });
        return count > 0;
    }

    /**
     * Delete attribute (hard delete, but only if not in use).
     */
    async delete(id: string): Promise<void> {
        await this.findById(id);

        const inUse = await this.isAttributeInUse(id);
        if (inUse) {
            throw new ConflictException(
                'Cannot delete attribute that has values in entity instances',
            );
        }

        await this.prisma.attribute.delete({ where: { id } });
    }

    /**
     * Add option to ENUM attribute.
     */
    async addOption(
        attributeId: string,
        value: string,
        displayName: string,
        sortOrder: number = 0,
        isActive: boolean = true,
    ): Promise<any> {
        const attribute = await this.findById(attributeId);

        if (attribute.dataType !== DataType.ENUM) {
            throw new BadRequestException(
                'Can only add options to ENUM type attributes',
            );
        }

        try {
            return await this.prisma.attributeOption.create({
                data: {
                    attributeId,
                    value,
                    displayName,
                    sortOrder,
                    isActive,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException(
                        `Option with value "${value}" already exists for this attribute`,
                    );
                }
            }
            throw error;
        }
    }

    /**
     * Update an attribute option.
     */
    async updateOption(
        attributeId: string,
        optionId: string,
        data: { displayName?: string; sortOrder?: number; isActive?: boolean },
    ): Promise<any> {
        // Validate attribute ownership
        await this.findById(attributeId);

        const option = await this.prisma.attributeOption.findUnique({
            where: { id: optionId },
        });

        if (!option || option.attributeId !== attributeId) {
            throw new NotFoundException('Option not found');
        }

        return await this.prisma.attributeOption.update({
            where: { id: optionId },
            data,
        });
    }

    /**
     * Soft delete an attribute option (set isActive = false).
     */
    async deleteOption(attributeId: string, optionId: string): Promise<void> {
        // Validate attribute ownership
        await this.findById(attributeId);

        const option = await this.prisma.attributeOption.findUnique({
            where: { id: optionId },
        });

        if (!option || option.attributeId !== attributeId) {
            throw new NotFoundException('Option not found');
        }

        await this.prisma.attributeOption.update({
            where: { id: optionId },
            data: { isActive: false },
        });
    }
}
