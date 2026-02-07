import { Injectable } from '@nestjs/common';
import type { AccessPolicy } from '.prisma/client';

// Re-define PolicyEffect locally to avoid import issues with Prisma v7
enum PolicyEffect {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
}

export interface PolicyContext {
    userId: string;
    tenantId: string;
    userRoles: string[];
    userDepartmentId?: string;
    [key: string]: any;
}

export interface EntityContext {
    id?: string;
    tenantId: string;
    createdById?: string;
    workflowState?: string;
    [key: string]: any;
}

export interface EvaluationResult {
    allowed: boolean;
    matchedPolicy?: string;
    reason?: string;
}

/**
 * ABAC Policy Evaluator Service.
 * Evaluates JSON-based policy conditions against request context.
 *
 * Condition format:
 * {
 *   "all": [...] | "any": [...] | { "attribute": "...", "operator": "...", "value": "..." }
 * }
 *
 * Operators: eq, neq, in, nin, gt, gte, lt, lte, contains, startsWith, endsWith
 */
@Injectable()
export class PolicyEvaluatorService {
    /**
     * Evaluate policies against context and entity.
     * Returns the first matching policy result (ordered by priority).
     */
    evaluate(
        policies: AccessPolicy[],
        context: PolicyContext,
        entity: EntityContext,
    ): EvaluationResult {
        // Sort by priority (higher first)
        const sortedPolicies = [...policies].sort((a, b) => b.priority - a.priority);

        for (const policy of sortedPolicies) {
            if (!policy.isActive) continue;

            const conditions = policy.conditions as any;
            const matches = this.evaluateCondition(conditions, context, entity);

            if (matches) {
                return {
                    allowed: policy.effect === PolicyEffect.ALLOW,
                    matchedPolicy: policy.name,
                    reason: policy.effect === PolicyEffect.DENY
                        ? `Denied by policy: ${policy.name}`
                        : undefined,
                };
            }
        }

        // Default deny if no policy matches
        return {
            allowed: false,
            reason: 'No matching policy found',
        };
    }

    /**
     * Check if any ALLOW policy permits the action (implicit allow).
     * Use this when you want to allow if any policy matches.
     */
    anyAllows(
        policies: AccessPolicy[],
        context: PolicyContext,
        entity: EntityContext,
    ): boolean {
        const allowPolicies = policies.filter((p) => p.effect === PolicyEffect.ALLOW);
        return allowPolicies.some((policy) => {
            if (!policy.isActive) return false;
            const conditions = policy.conditions as any;
            return this.evaluateCondition(conditions, context, entity);
        });
    }

    private evaluateCondition(
        condition: any,
        context: PolicyContext,
        entity: EntityContext,
    ): boolean {
        if (!condition) return true;

        // Handle "all" (AND)
        if (condition.all && Array.isArray(condition.all)) {
            return condition.all.every((c: any) =>
                this.evaluateCondition(c, context, entity),
            );
        }

        // Handle "any" (OR)
        if (condition.any && Array.isArray(condition.any)) {
            return condition.any.some((c: any) =>
                this.evaluateCondition(c, context, entity),
            );
        }

        // Handle single condition
        if (condition.attribute && condition.operator) {
            return this.evaluateSingleCondition(condition, context, entity);
        }

        return false;
    }

    private evaluateSingleCondition(
        condition: { attribute: string; operator: string; value: any },
        context: PolicyContext,
        entity: EntityContext,
    ): boolean {
        const { attribute, operator, value } = condition;

        // Resolve attribute value
        const actualValue = this.resolveAttribute(attribute, context, entity);

        // Resolve comparison value (may be a context reference)
        const comparisonValue = this.resolveValue(value, context, entity);

        return this.compare(actualValue, operator, comparisonValue);
    }

    private resolveAttribute(
        attribute: string,
        context: PolicyContext,
        entity: EntityContext,
    ): any {
        const [prefix, ...rest] = attribute.split('.');
        const path = rest.join('.');

        if (prefix === 'context') {
            return this.getNestedValue(context, path);
        }
        if (prefix === 'instance' || prefix === 'entity') {
            return this.getNestedValue(entity, path);
        }

        return undefined;
    }

    private resolveValue(
        value: any,
        context: PolicyContext,
        entity: EntityContext,
    ): any {
        if (typeof value !== 'string') return value;

        // Check if it's a context reference
        if (value.startsWith('context.')) {
            const path = value.substring(8);
            return this.getNestedValue(context, path);
        }
        if (value.startsWith('instance.') || value.startsWith('entity.')) {
            const path = value.includes('instance.')
                ? value.substring(9)
                : value.substring(7);
            return this.getNestedValue(entity, path);
        }

        return value;
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private compare(actual: any, operator: string, expected: any): boolean {
        switch (operator) {
            case 'eq':
                return actual === expected;
            case 'neq':
                return actual !== expected;
            case 'in':
                return Array.isArray(expected) && expected.includes(actual);
            case 'nin':
                return Array.isArray(expected) && !expected.includes(actual);
            case 'gt':
                return actual > expected;
            case 'gte':
                return actual >= expected;
            case 'lt':
                return actual < expected;
            case 'lte':
                return actual <= expected;
            case 'contains':
                return typeof actual === 'string' && actual.includes(expected);
            case 'startsWith':
                return typeof actual === 'string' && actual.startsWith(expected);
            case 'endsWith':
                return typeof actual === 'string' && actual.endsWith(expected);
            default:
                return false;
        }
    }
}
