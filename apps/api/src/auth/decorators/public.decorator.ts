import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public (no authentication required).
 * Use sparingly - only for login, health checks, etc.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
