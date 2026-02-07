import { DataType } from '../enums/data-type.enum';
import { AttributeOptionResponseDto } from './attribute-option-response.dto';

/**
 * Response DTO for Attribute.
 *
 * Represents a complete attribute with all its properties.
 * For ENUM type attributes, includes the options array.
 */
export class AttributeResponseDto {
    id: string;
    tenantId: string;
    entityTypeId: string;
    name: string;
    displayName: string;
    description: string | null;
    dataType: DataType;
    isRequired: boolean;
    isUnique: boolean;
    isSearchable: boolean;
    defaultValue: any;
    validationRules: any;
    sortOrder: number;
    relatedEntityTypeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    options?: AttributeOptionResponseDto[]; // Included for ENUM type
}

/**
 * Paginated response DTO for list of attributes.
 */
export class AttributeListResponseDto {
    data: AttributeResponseDto[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
