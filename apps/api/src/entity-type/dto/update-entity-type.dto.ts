import { PartialType } from '@nestjs/mapped-types';
import { CreateEntityTypeDto } from './create-entity-type.dto';

/**
 * DTO for updating an entity type.
 * All fields are optional while preserving validation rules from CreateEntityTypeDto.
 */
export class UpdateEntityTypeDto extends PartialType(CreateEntityTypeDto) {}
