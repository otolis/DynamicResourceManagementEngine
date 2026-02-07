import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import {
    PERMISSION_KEY,
    RequiredPermission,
} from '../decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class RbacGuard implements CanActivate {
    // Cache permissions to avoid repeated database queries
    private permissionCache = new Map<string, Set<string>>();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes
    private cacheTimestamps = new Map<string, number>();

    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
            PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no permission required, allow access
        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Check if user has required permission
        const hasPermission = await this.checkPermission(
            user,
            requiredPermission.resource,
            requiredPermission.action,
        );

        if (!hasPermission) {
            throw new ForbiddenException(
                `Permission denied: ${requiredPermission.resource}:${requiredPermission.action}`,
            );
        }

        return true;
    }

    private async checkPermission(
        user: AuthenticatedUser,
        resource: string,
        action: string,
    ): Promise<boolean> {
        // "manage" permission grants all actions
        const permissionKey = `${resource}:${action}`;
        const manageKey = `${resource}:manage`;

        for (const roleName of user.roles) {
            const permissions = await this.getPermissionsForRole(roleName, user.tenantId);
            if (permissions.has(permissionKey) || permissions.has(manageKey)) {
                return true;
            }
        }

        return false;
    }

    private async getPermissionsForRole(
        roleName: string,
        tenantId: string,
    ): Promise<Set<string>> {
        const cacheKey = `${tenantId}:${roleName}`;

        // Check cache
        const cachedTimestamp = this.cacheTimestamps.get(cacheKey);
        if (cachedTimestamp && Date.now() - cachedTimestamp < this.cacheTimeout) {
            const cached = this.permissionCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Fetch from database
        const role = await this.prisma.role.findUnique({
            where: { tenantId_name: { tenantId, name: roleName } },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        const permissions = new Set<string>();
        if (role) {
            for (const rp of role.permissions) {
                permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
            }
        }

        // Update cache
        this.permissionCache.set(cacheKey, permissions);
        this.cacheTimestamps.set(cacheKey, Date.now());

        return permissions;
    }
}
