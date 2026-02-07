import { Type } from 'class-transformer';
import {
    IsArray,
    ValidateNested,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';
import { CreateAttributeDto } from './create-attribute.dto';
import { AttributeResponseDto } from './attribute-response.dto';

/**
 * DTO for bulk creating attributes.
 * Maximum 50 attributes per request to prevent abuse.
 */
export class BulkCreateAttributeDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one attribute is required' })
    @ArrayMaxSize(50, {
        message: 'Cannot create more than 50 attributes at once',
    })
    @ValidateNested({ each: true })
    @Type(() => CreateAttributeDto)
    attributes: CreateAttributeDto[];
}

/**
 * Response DTO for bulk create operation.
 * Supports partial success - some may succeed, some may fail.
 */
export class BulkCreateAttributeResponseDto {
    created: AttributeResponseDto[];
    failed: {
        index: number;
        data: CreateAttributeDto;
        error: string;
    }[];
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}
