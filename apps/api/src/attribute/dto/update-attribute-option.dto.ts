import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAttributeOptionDto } from './create-attribute-option.dto';

/**
 * DTO for updating an AttributeOption.
 *
 * Allows partial updates. The 'value' field cannot be changed after creation
 * as it may be referenced in existing entity instances.
 */
export class UpdateAttributeOptionDto extends PartialType(
    OmitType(CreateAttributeOptionDto, ['value'] as const),
) {}
