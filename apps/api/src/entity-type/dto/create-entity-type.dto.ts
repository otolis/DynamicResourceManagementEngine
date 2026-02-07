import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNotEmpty,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class CreateEntityTypeDto {
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
    @MinLength(1, { message: 'Display name must not be empty' })
    @MaxLength(100, { message: 'Display name must not exceed 100 characters' })
    displayName: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Description must not exceed 500 characters' })
    description?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50, { message: 'Icon name must not exceed 50 characters' })
    @Matches(/^[a-zA-Z0-9_-]+$/, {
        message:
            'Icon name can only contain letters, numbers, hyphens, and underscores',
    })
    iconName?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
