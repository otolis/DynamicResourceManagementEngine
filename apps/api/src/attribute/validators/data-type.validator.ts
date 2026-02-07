import { DataType } from '../enums/data-type.enum';

/**
 * Validates that defaultValue matches the attribute's dataType.
 * Returns array of error messages (empty array = valid).
 *
 * This follows the pattern from password.validator.ts -
 * returning an array of error strings for flexible error handling.
 */
export function validateDefaultValue(
    dataType: DataType,
    defaultValue: any,
): string[] {
    const errors: string[] = [];

    if (defaultValue === null || defaultValue === undefined) {
        return errors; // null/undefined is always valid (optional default)
    }

    switch (dataType) {
        case DataType.STRING:
        case DataType.TEXT:
            if (typeof defaultValue !== 'string') {
                errors.push(
                    `Default value must be a string for ${dataType} type`,
                );
            }
            break;

        case DataType.NUMBER:
            if (!Number.isInteger(defaultValue)) {
                errors.push('Default value must be an integer for NUMBER type');
            }
            break;

        case DataType.DECIMAL:
            if (typeof defaultValue !== 'number') {
                errors.push('Default value must be a number for DECIMAL type');
            }
            break;

        case DataType.BOOLEAN:
            if (typeof defaultValue !== 'boolean') {
                errors.push('Default value must be a boolean for BOOLEAN type');
            }
            break;

        case DataType.DATE:
        case DataType.DATETIME:
            if (!isValidDate(defaultValue)) {
                errors.push(
                    `Default value must be a valid ISO date string for ${dataType} type`,
                );
            }
            break;

        case DataType.ENUM:
            if (typeof defaultValue !== 'string') {
                errors.push(
                    'Default value must be a string (option value) for ENUM type',
                );
            }
            break;

        case DataType.JSON:
            // JSON can be any valid JSON value
            try {
                JSON.stringify(defaultValue);
            } catch {
                errors.push('Default value must be valid JSON');
            }
            break;

        case DataType.RELATION:
            errors.push('RELATION type cannot have a default value');
            break;
    }

    return errors;
}

/**
 * Check if a value is a valid ISO date string.
 */
function isValidDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Convenience function to check if defaultValue is valid.
 * Returns true if valid, false otherwise.
 */
export function isDefaultValueValid(
    dataType: DataType,
    defaultValue: any,
): boolean {
    return validateDefaultValue(dataType, defaultValue).length === 0;
}
