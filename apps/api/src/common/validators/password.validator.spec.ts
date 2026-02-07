import { validatePasswordStrength } from './password.validator';

describe('validatePasswordStrength', () => {
  describe('valid passwords', () => {
    it('should accept a strong password', () => {
      const errors = validatePasswordStrength('MySecure@Pass123');
      expect(errors).toHaveLength(0);
    });

    it('should accept a password with various special characters', () => {
      const errors = validatePasswordStrength('Test!@#$%Pass123');
      expect(errors).toHaveLength(0);
    });
  });

  describe('length requirements', () => {
    it('should reject passwords shorter than 12 characters', () => {
      const errors = validatePasswordStrength('Short@1Ab');
      expect(errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject passwords longer than 128 characters', () => {
      const longPassword = 'A'.repeat(100) + 'a1@' + 'B'.repeat(30);
      const errors = validatePasswordStrength(longPassword);
      expect(errors).toContain('Password must not exceed 128 characters');
    });
  });

  describe('character requirements', () => {
    it('should reject passwords without lowercase letters', () => {
      const errors = validatePasswordStrength('ALLUPPERCASE@123');
      expect(errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without uppercase letters', () => {
      const errors = validatePasswordStrength('alllowercase@123');
      expect(errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without numbers', () => {
      const errors = validatePasswordStrength('NoNumbersHere@!Ab');
      expect(errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const errors = validatePasswordStrength('NoSpecialChars123Ab');
      expect(errors).toContain('Password must contain at least one special character');
    });
  });

  describe('common patterns detection', () => {
    it('should reject passwords containing "password"', () => {
      const errors = validatePasswordStrength('MyPassword@123!');
      expect(errors).toContain('Password contains a common weak pattern');
    });

    it('should reject passwords starting with "123456"', () => {
      const errors = validatePasswordStrength('123456Secure@Pass');
      expect(errors).toContain('Password contains a common weak pattern');
    });

    it('should reject passwords containing "admin"', () => {
      const errors = validatePasswordStrength('AdminUser@123456');
      expect(errors).toContain('Password contains a common weak pattern');
    });

    it('should reject passwords containing "qwerty"', () => {
      const errors = validatePasswordStrength('Qwerty!@#456789Ab');
      expect(errors).toContain('Password contains a common weak pattern');
    });
  });

  describe('edge cases', () => {
    it('should handle empty password', () => {
      const errors = validatePasswordStrength('');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle null-like values', () => {
      const errors = validatePasswordStrength(null as any);
      expect(errors).toContain('Password is required');
    });

    it('should handle undefined', () => {
      const errors = validatePasswordStrength(undefined as any);
      expect(errors).toContain('Password is required');
    });
  });
});
