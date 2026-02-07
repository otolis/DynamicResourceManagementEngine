import {
    IsOptional,
    IsString,
    IsBoolean,
    IsInt,
    IsIn,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for searching and filtering entity types.
 * Supports pagination, sorting, and full-text search.
 */
export class SearchEntityTypeDto {
    @IsOptional()
    @IsString()
    search?: string; // Searches across name, displayName, description

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean;

    @IsOptional()
    @IsString()
    @IsIn(['name', 'displayName', 'createdAt', 'updatedAt'])
    sortBy?: 'name' | 'displayName' | 'createdAt' | 'updatedAt';

    @IsOptional()
    @IsString()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

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
