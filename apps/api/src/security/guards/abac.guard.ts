import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../tenant/tenant-context.service';
import {
    PolicyEvaluatorService,
    PolicyContext,
    EntityContext,
} from '../services/policy-evaluator.service';
import {
    PERMISSION_KEY,
    RequiredPermission,
} from '../decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';

/**
 * ABAC Guard for fine-grained access control.
 * Evaluates AccessPolicy conditions against request context.
 *
 * This guard runs AFTER RbacGuard to provide additional attribute-based restrictions.
 */
@Injectable()
export class AbacGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
        private readonly tenantContext: TenantContextService,
        private readonly policyEvaluator: PolicyEvaluatorService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
            PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no permission specified, skip ABAC evaluation
        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        const tenantId = this.tenantContext.getTenantIdOrNull() || user.tenantId;

        // Fetch applicable policies
        const policies = await this.prisma.accessPolicy.findMany({
            where: {
                tenantId,
                resource: requiredPermission.resource,
                action: requiredPermission.action,
                isActive: true,
            },
            orderBy: { priority: 'desc' },
        });

        // If no policies defined, allow (RBAC already passed)
        if (policies.length === 0) {
            return true;
        }

        // Build context
        const policyContext: PolicyContext = {
            userId: user.id,
            tenantId: user.tenantId,
            userRoles: user.roles,
        };

        // Build entity context from request (if available)
        const entityContext: EntityContext = this.buildEntityContext(request, tenantId);

        // Evaluate policies
        const result = this.policyEvaluator.evaluate(policies, policyContext, entityContext);

        if (!result.allowed) {
            throw new ForbiddenException(result.reason || 'Access denied by policy');
        }

        return true;
    }

    private buildEntityContext(request: any, tenantId: string): EntityContext {
        // Start with basic context
        const context: EntityContext = {
            tenantId,
        };

        // Add entity ID from params if present
        if (request.params?.id) {
            context.id = request.params.id;
        }

        // Add entity data from body if present (for create/update)
        if (request.body) {
            Object.assign(context, request.body);
        }

        // Add entity data if it was fetched by a previous middleware/interceptor
        if (request.entity) {
            Object.assign(context, request.entity);
        }

        return context;
    }
}
