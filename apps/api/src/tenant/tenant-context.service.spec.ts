import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('run', () => {
    it('should execute callback within tenant context', () => {
      const result = service.run('tenant-123', () => {
        const tenantId = service.getTenantIdOrNull();
        expect(tenantId).toBe('tenant-123');
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should isolate context between nested runs', () => {
      const results: string[] = [];

      service.run('tenant-A', () => {
        results.push(service.getTenantIdOrNull() || 'null');

        service.run('tenant-B', () => {
          results.push(service.getTenantIdOrNull() || 'null');
        });

        // After nested run, should return to outer context
        results.push(service.getTenantIdOrNull() || 'null');
      });

      expect(results).toEqual(['tenant-A', 'tenant-B', 'tenant-A']);
    });

    it('should return callback result', () => {
      const result = service.run('tenant-123', () => {
        return { id: 1, name: 'test' };
      });

      expect(result).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('getTenantId', () => {
    it('should throw ForbiddenException when no context is set', () => {
      expect(() => service.getTenantId()).toThrow('Tenant context is required');
    });

    it('should return tenantId when context is set', () => {
      service.run('tenant-123', () => {
        expect(service.getTenantId()).toBe('tenant-123');
      });
    });
  });

  describe('getTenantIdOrNull', () => {
    it('should return null when no context is set', () => {
      expect(service.getTenantIdOrNull()).toBeNull();
    });

    it('should return tenantId when context is set', () => {
      service.run('tenant-123', () => {
        expect(service.getTenantIdOrNull()).toBe('tenant-123');
      });
    });
  });
});
