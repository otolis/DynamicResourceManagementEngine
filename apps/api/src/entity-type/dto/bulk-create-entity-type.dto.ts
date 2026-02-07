import { Type } from 'class-transformer';
import {
    IsArray,
    ValidateNested,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';
import { CreateEntityTypeDto } from './create-entity-type.dto';
import { EntityTypeResponseDto } from './entity-type-response.dto';

/**
 * DTO for bulk creating entity types.
 * Maximum 50 entities per request to prevent abuse.
 */
export class BulkCreateEntityTypeDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one entity type is required' })
    @ArrayMaxSize(50, { message: 'Cannot create more than 50 entity types at once' })
    @ValidateNested({ each: true })
    @Type(() => CreateEntityTypeDto)
    entityTypes: CreateEntityTypeDto[];
}

/**
 * Response DTO for bulk create operation.
 * Supports partial success - some may succeed, some may fail.
 */
export class BulkCreateResponseDto {
    created: EntityTypeResponseDto[];
    failed: {
        index: number;
        data: CreateEntityTypeDto;
        error: string;
    }[];
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}
