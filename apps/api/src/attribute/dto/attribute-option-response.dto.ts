/**
 * Response DTO for AttributeOption.
 *
 * Represents a single option for an ENUM type attribute.
 */
export class AttributeOptionResponseDto {
    id: string;
    attributeId: string;
    value: string;
    displayName: string;
    sortOrder: number;
    isActive: boolean;
}
