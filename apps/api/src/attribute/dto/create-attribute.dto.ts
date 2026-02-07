import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNotEmpty,
    IsEnum,
    IsInt,
    IsUUID,
    MinLength,
    MaxLength,
    Matches,
    ValidateNested,
    ArrayMinSize,
    ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataType } from '../enums/data-type.enum';
import { CreateAttributeOptionDto } from './create-attribute-option.dto';

/**
 * DTO for creating an Attribute.
 *
 * Attributes define the fields/properties that an EntityType can have.
 * For example, a "Customer" EntityType might have attributes like:
 * - firstName (STRING)
 * - email (STRING with unique constraint)
 * - status (ENUM with options)
 * - accountManager (RELATION to User EntityType)
 */
export class CreateAttributeDto {
    @IsUUID()
    @IsNotEmpty({ message: 'Entity type ID is required' })
    entityTypeId: string;

    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @MaxLength(50, { message: 'Name must not exceed 50 characters' })
    @Matches(/^[a-z][a-z0-9_]*$/, {
        message:
            'Name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
    })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Display name is required' })
    @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
    displayName: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Description must not exceed 500 characters' })
    description?: string;

    @IsEnum(DataType, { message: 'Invalid data type' })
    @IsNotEmpty({ message: 'Data type is required' })
    dataType: DataType;

    @IsBoolean()
    @IsOptional()
    isRequired?: boolean = false;

    @IsBoolean()
    @IsOptional()
    isUnique?: boolean = false;

    @IsBoolean()
    @IsOptional()
    isSearchable?: boolean = false;

    @IsOptional()
    defaultValue?: any; // Validated in service layer against dataType

    @IsOptional()
    validationRules?: any; // JSON - Validated in service layer

    @IsInt()
    @IsOptional()
    sortOrder?: number = 0;

    // Required if dataType === RELATION
    @ValidateIf((o) => o.dataType === DataType.RELATION)
    @IsUUID()
    @IsNotEmpty({
        message: 'relatedEntityTypeId is required for RELATION type',
    })
    relatedEntityTypeId?: string;

    // Optional: For ENUM type, create options inline
    @ValidateIf((o) => o.dataType === DataType.ENUM)
    @IsOptional()
    @ValidateNested({ each: true })
    @ArrayMinSize(1, { message: 'ENUM type must have at least one option' })
    @Type(() => CreateAttributeOptionDto)
    options?: CreateAttributeOptionDto[];
}
