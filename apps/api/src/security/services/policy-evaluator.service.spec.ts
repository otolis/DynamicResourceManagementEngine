import { Test, TestingModule } from '@nestjs/testing';
import {
  PolicyEvaluatorService,
  PolicyContext,
  EntityContext,
} from './policy-evaluator.service';

// Mock AccessPolicy type
interface MockAccessPolicy {
  id: string;
  name: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  isActive: boolean;
  conditions: any;
}

describe('PolicyEvaluatorService', () => {
  let service: PolicyEvaluatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolicyEvaluatorService],
    }).compile();

    service = module.get<PolicyEvaluatorService>(PolicyEvaluatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluate', () => {
    const baseContext: PolicyContext = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      userRoles: ['manager'],
      primaryRole: 'manager',
    };

    const baseEntity: EntityContext = {
      id: 'entity-789',
      tenantId: 'tenant-456',
      createdById: 'user-123',
    };

    it('should deny by default when no policies match', () => {
      const result = service.evaluate([], baseContext, baseEntity);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No matching policy found');
    });

    it('should allow when ALLOW policy condition matches', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Allow Own Records',
          effect: 'ALLOW',
          priority: 10,
          isActive: true,
          conditions: {
            attribute: 'context.userId',
            operator: 'eq',
            value: 'instance.createdById',
          },
        },
      ];

      const result = service.evaluate(policies as any, baseContext, baseEntity);
      expect(result.allowed).toBe(true);
      expect(result.matchedPolicy).toBe('Allow Own Records');
    });

    it('should deny when DENY policy matches', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Deny Guest Role',
          effect: 'DENY',
          priority: 100,
          isActive: true,
          conditions: {
            attribute: 'context.primaryRole',
            operator: 'in',
            value: ['guest', 'suspended'],
          },
        },
      ];

      const contextWithGuest: PolicyContext = {
        ...baseContext,
        primaryRole: 'guest',
        userRoles: ['guest'],
      };

      const result = service.evaluate(policies as any, contextWithGuest, baseEntity);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Deny Guest Role');
    });

    it('should skip inactive policies', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Inactive Allow',
          effect: 'ALLOW',
          priority: 10,
          isActive: false, // Inactive
          conditions: { attribute: 'context.userId', operator: 'eq', value: 'user-123' },
        },
      ];

      const result = service.evaluate(policies as any, baseContext, baseEntity);
      expect(result.allowed).toBe(false); // Should not match inactive policy
      expect(result.reason).toBe('No matching policy found');
    });

    it('should evaluate higher priority policies first', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Low Priority Allow',
          effect: 'ALLOW',
          priority: 1,
          isActive: true,
          conditions: { attribute: 'context.userId', operator: 'eq', value: 'user-123' },
        },
        {
          id: 'policy-2',
          name: 'High Priority Deny',
          effect: 'DENY',
          priority: 100,
          isActive: true,
          conditions: { attribute: 'context.userId', operator: 'eq', value: 'user-123' },
        },
      ];

      const result = service.evaluate(policies as any, baseContext, baseEntity);
      expect(result.allowed).toBe(false); // Higher priority DENY should win
      expect(result.matchedPolicy).toBe('High Priority Deny');
    });

    it('should handle "all" (AND) conditions', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Multiple Conditions',
          effect: 'ALLOW',
          priority: 10,
          isActive: true,
          conditions: {
            all: [
              { attribute: 'context.userId', operator: 'eq', value: 'user-123' },
              { attribute: 'context.tenantId', operator: 'eq', value: 'tenant-456' },
            ],
          },
        },
      ];

      const result = service.evaluate(policies as any, baseContext, baseEntity);
      expect(result.allowed).toBe(true);
    });

    it('should handle "any" (OR) conditions', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Any Role',
          effect: 'ALLOW',
          priority: 10,
          isActive: true,
          conditions: {
            any: [
              { attribute: 'context.primaryRole', operator: 'in', value: ['admin'] },
              { attribute: 'context.primaryRole', operator: 'in', value: ['manager'] },
            ],
          },
        },
      ];

      const result = service.evaluate(policies as any, baseContext, baseEntity);
      expect(result.allowed).toBe(true); // manager role matches
    });

    it('should handle comparison operators', () => {
      const entityWithState: EntityContext = {
        ...baseEntity,
        priority: 5,
        status: 'pending_review',
      };

      // Test 'gt' operator
      const gtPolicy: MockAccessPolicy = {
        id: 'policy-1',
        name: 'High Priority',
        effect: 'ALLOW',
        priority: 10,
        isActive: true,
        conditions: { attribute: 'entity.priority', operator: 'gt', value: 3 },
      };

      let result = service.evaluate([gtPolicy] as any, baseContext, entityWithState);
      expect(result.allowed).toBe(true);

      // Test 'contains' operator
      const containsPolicy: MockAccessPolicy = {
        id: 'policy-2',
        name: 'Pending Status',
        effect: 'ALLOW',
        priority: 10,
        isActive: true,
        conditions: { attribute: 'entity.status', operator: 'contains', value: 'pending' },
      };

      result = service.evaluate([containsPolicy] as any, baseContext, entityWithState);
      expect(result.allowed).toBe(true);
    });

    it('should allow with null conditions (match all)', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Allow All',
          effect: 'ALLOW',
          priority: 10,
          isActive: true,
          conditions: null, // No conditions = matches all
        },
      ];

      const result = service.evaluate(policies as any, baseContext, baseEntity);
      expect(result.allowed).toBe(true);
    });
  });

  describe('anyAllows', () => {
    const baseContext: PolicyContext = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      userRoles: ['member'],
      primaryRole: 'member',
    };

    const baseEntity: EntityContext = {
      tenantId: 'tenant-456',
    };

    it('should return true if any ALLOW policy matches', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Deny All',
          effect: 'DENY',
          priority: 100,
          isActive: true,
          conditions: null, // Null conditions => matches
        },
        {
          id: 'policy-2',
          name: 'Allow Members',
          effect: 'ALLOW',
          priority: 10,
          isActive: true,
          conditions: { attribute: 'context.primaryRole', operator: 'in', value: ['member', 'admin'] },
        },
      ];

      const result = service.anyAllows(policies as any, baseContext, baseEntity);
      expect(result).toBe(true);
    });

    it('should return false if no ALLOW policy matches', () => {
      const policies: MockAccessPolicy[] = [
        {
          id: 'policy-1',
          name: 'Allow Admins Only',
          effect: 'ALLOW',
          priority: 10,
          isActive: true,
          conditions: { attribute: 'context.primaryRole', operator: 'in', value: ['admin'] },
        },
      ];

      const result = service.anyAllows(policies as any, baseContext, baseEntity);
      expect(result).toBe(false);
    });
  });
});
