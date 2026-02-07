import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
    resource: string;
    action: string;
}

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Decorator to specify required permission for a route.
 * @param resource - The resource type (e.g., 'entityInstance', 'user', 'role')
 * @param action - The action (e.g., 'create', 'read', 'update', 'delete', 'manage')
 */
export const RequirePermission = (resource: string, action: string) =>
    SetMetadata(PERMISSION_KEY, { resource, action } as RequiredPermission);
