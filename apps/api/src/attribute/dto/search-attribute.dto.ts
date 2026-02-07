import {
    IsOptional,
    IsString,
    IsEnum,
    IsUUID,
    IsInt,
    IsIn,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataType } from '../enums/data-type.enum';

/**
 * DTO for searching and filtering attributes.
 *
 * Supports:
 * - Filtering by parent EntityType
 * - Filtering by DataType
 * - Text search in name, displayName, description
 * - Pagination
 * - Sorting
 */
export class SearchAttributeDto {
    @IsOptional()
    @IsUUID()
    entityTypeId?: string; // Filter by parent entity type

    @IsOptional()
    @IsEnum(DataType)
    dataType?: DataType; // Filter by data type

    @IsOptional()
    @IsString()
    search?: string; // Search in name, displayName, description

    @IsOptional()
    @IsString()
    @IsIn(['name', 'displayName', 'sortOrder', 'createdAt'])
    sortBy?: string = 'sortOrder';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'asc';

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 10;
}
