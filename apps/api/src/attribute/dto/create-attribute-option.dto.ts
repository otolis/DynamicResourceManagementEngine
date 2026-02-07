import {
    IsString,
    IsNotEmpty,
    IsInt,
    IsBoolean,
    IsOptional,
    MaxLength,
} from 'class-validator';

/**
 * DTO for creating an AttributeOption (for ENUM type attributes).
 *
 * AttributeOptions define the predefined choices available for an ENUM attribute.
 * For example, a "status" attribute might have options: "active", "inactive", "suspended".
 */
export class CreateAttributeOptionDto {
    @IsString()
    @IsNotEmpty({ message: 'Option value is required' })
    @MaxLength(50, { message: 'Option value must not exceed 50 characters' })
    value: string;

    @IsString()
    @IsNotEmpty({ message: 'Option display name is required' })
    @MaxLength(100, {
        message: 'Option display name must not exceed 100 characters',
    })
    displayName: string;

    @IsInt()
    @IsOptional()
    sortOrder?: number = 0;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;
}
