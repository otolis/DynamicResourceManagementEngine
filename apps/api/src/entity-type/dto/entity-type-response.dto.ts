/**
 * Response DTO for entity type data.
 * No validation decorators needed for response DTOs.
 */
export class EntityTypeResponseDto {
    id: string;
    tenantId: string;
    name: string;
    displayName: string;
    description: string | null;
    iconName: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Response DTO for entity type with relation counts.
 */
export class EntityTypeWithRelationsDto extends EntityTypeResponseDto {
    attributeCount: number;
    instanceCount: number;
    workflowCount: number;
}

/**
 * Pagination metadata for list responses.
 */
export class PaginationMetaDto {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Response DTO for paginated entity type list.
 */
export class EntityTypeListResponseDto {
    data: EntityTypeResponseDto[];
    meta: PaginationMetaDto;
}
