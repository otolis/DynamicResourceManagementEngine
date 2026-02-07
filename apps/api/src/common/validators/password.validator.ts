/**
 * Password validation rules for production security:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter  
 * - At least one number
 * - At least one special character
 * - Maximum 128 characters (prevent DoS via bcrypt)
 */

/**
 * Validate password strength.
 * Returns array of validation error messages.
 */
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return ['Password is required'];
  }

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&#^()_\-+=\[\]{}|\\:;"'<>,.\/~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak patterns
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains a common weak pattern');
      break;
    }
  }

  return errors;
}

/**
 * Check if password meets all requirements.
 * Returns true if valid, false otherwise.
 */
export function isPasswordValid(password: string): boolean {
  return validatePasswordStrength(password).length === 0;
}
