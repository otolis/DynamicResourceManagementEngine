import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAttributeDto } from './create-attribute.dto';

/**
 * DTO for updating an Attribute.
 *
 * Allows partial updates, but entityTypeId, dataType, and options cannot be changed.
 * - entityTypeId: Cannot move an attribute to a different entity type
 * - dataType: Cannot change the data type after creation (would break existing data)
 * - options: ENUM options are managed through separate endpoints
 */
export class UpdateAttributeDto extends PartialType(
    OmitType(CreateAttributeDto, [
        'entityTypeId',
        'dataType',
        'options',
    ] as const),
) {}
