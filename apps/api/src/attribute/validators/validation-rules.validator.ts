import { DataType } from '../enums/data-type.enum';

/**
 * Validates that validationRules structure is appropriate for the dataType.
 * Returns array of error messages (empty array = valid).
 *
 * Different data types support different validation rules:
 * - STRING/TEXT: minLength, maxLength, pattern
 * - NUMBER/DECIMAL: min, max
 * - ENUM: No validationRules (uses AttributeOptions instead)
 * - RELATION: No validationRules supported
 * - Others: No specific rules defined yet
 */
export function validateValidationRules(
    dataType: DataType,
    rules: any,
): string[] {
    const errors: string[] = [];

    if (!rules) return errors; // null/undefined is valid (no rules)

    if (typeof rules !== 'object' || Array.isArray(rules)) {
        errors.push('Validation rules must be a JSON object');
        return errors;
    }

    switch (dataType) {
        case DataType.STRING:
        case DataType.TEXT:
            if (
                rules.minLength !== undefined &&
                !Number.isInteger(rules.minLength)
            ) {
                errors.push('minLength must be an integer');
            }
            if (rules.minLength !== undefined && rules.minLength < 0) {
                errors.push('minLength must be non-negative');
            }

            if (
                rules.maxLength !== undefined &&
                !Number.isInteger(rules.maxLength)
            ) {
                errors.push('maxLength must be an integer');
            }
            if (rules.maxLength !== undefined && rules.maxLength < 1) {
                errors.push('maxLength must be positive');
            }

            if (
                rules.minLength !== undefined &&
                rules.maxLength !== undefined &&
                rules.minLength > rules.maxLength
            ) {
                errors.push('minLength cannot be greater than maxLength');
            }

            if (rules.pattern !== undefined && typeof rules.pattern !== 'string') {
                errors.push('pattern must be a regex string');
            }

            // Validate regex pattern is valid
            if (rules.pattern !== undefined && typeof rules.pattern === 'string') {
                try {
                    new RegExp(rules.pattern);
                } catch {
                    errors.push('pattern must be a valid regular expression');
                }
            }
            break;

        case DataType.NUMBER:
        case DataType.DECIMAL:
            if (rules.min !== undefined && typeof rules.min !== 'number') {
                errors.push('min must be a number');
            }
            if (rules.max !== undefined && typeof rules.max !== 'number') {
                errors.push('max must be a number');
            }

            if (
                rules.min !== undefined &&
                rules.max !== undefined &&
                rules.min > rules.max
            ) {
                errors.push('min cannot be greater than max');
            }
            break;

        case DataType.ENUM:
            errors.push('ENUM type uses AttributeOptions, not validationRules');
            break;

        case DataType.RELATION:
            errors.push('RELATION type does not support validationRules');
            break;

        // DATE, DATETIME, BOOLEAN, JSON don't have specific validation rules defined
        // but we don't error if rules are provided - just ignore them
    }

    return errors;
}

/**
 * Convenience function to check if validationRules are valid.
 * Returns true if valid, false otherwise.
 */
export function areValidationRulesValid(
    dataType: DataType,
    rules: any,
): boolean {
    return validateValidationRules(dataType, rules).length === 0;
}
