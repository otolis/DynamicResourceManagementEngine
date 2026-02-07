import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EntityTypeRepository } from './entity-type.repository';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { CreateEntityTypeDto } from './dto';

describe('EntityTypeRepository', () => {
    let repository: EntityTypeRepository;
    let prisma: PrismaService;
    let tenantContext: TenantContextService;

    const mockTenantId = 'tenant-123';
    const mockEntityType = {
        id: 'et-1',
        tenantId: mockTenantId,
        name: 'project',
        displayName: 'Project',
        description: 'Project entity',
        iconName: 'folder',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockPrismaService = {
        entityType: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockTenantContextService = {
        getTenantId: jest.fn().mockReturnValue(mockTenantId),
        getTenantIdOrNull: jest.fn().mockReturnValue(mockTenantId),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EntityTypeRepository,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: TenantContextService, useValue: mockTenantContextService },
            ],
        }).compile();

        repository = module.get<EntityTypeRepository>(EntityTypeRepository);
        prisma = module.get<PrismaService>(PrismaService);
        tenantContext = module.get<TenantContextService>(TenantContextService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create entity type with tenant isolation', async () => {
            const dto: CreateEntityTypeDto = {
                name: 'project',
                displayName: 'Project',
                description: 'Project entity',
                iconName: 'folder',
                isActive: true,
            };

            mockPrismaService.entityType.create.mockResolvedValue(mockEntityType);

            const result = await repository.create(dto);

            expect(result).toEqual(mockEntityType);
            expect(mockPrismaService.entityType.create).toHaveBeenCalledWith({
                data: {
                    ...dto,
                    tenantId: mockTenantId,
                },
            });
        });

        it('should throw ConflictException on unique constraint violation', async () => {
            const dto: CreateEntityTypeDto = {
                name: 'project',
                displayName: 'Project',
            };

            mockPrismaService.entityType.create.mockRejectedValue({
                code: 'P2002',
            });

            await expect(repository.create(dto)).rejects.toThrow(ConflictException);
        });
    });

    describe('findAll', () => {
        it('should return paginated results with tenant filtering', async () => {
            const searchDto = { page: 1, limit: 10 };
            const mockData = [mockEntityType];

            mockPrismaService.entityType.findMany.mockResolvedValue(mockData);
            mockPrismaService.entityType.count.mockResolvedValue(1);

            const result = await repository.findAll(searchDto);

            expect(result).toEqual({ data: mockData, total: 1 });
            expect(mockPrismaService.entityType.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId: mockTenantId }),
                }),
            );
        });

        it('should apply search filters correctly', async () => {
            const searchDto = { search: 'project', isActive: true, page: 1, limit: 10 };

            mockPrismaService.entityType.findMany.mockResolvedValue([]);
            mockPrismaService.entityType.count.mockResolvedValue(0);

            await repository.findAll(searchDto);

            expect(mockPrismaService.entityType.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        tenantId: mockTenantId,
                        isActive: true,
                        OR: expect.arrayContaining([
                            expect.objectContaining({ name: expect.anything() }),
                        ]),
                    }),
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return entity type if found and belongs to tenant', async () => {
            mockPrismaService.entityType.findUnique.mockResolvedValue(mockEntityType);

            const result = await repository.findById('et-1');

            expect(result).toEqual(mockEntityType);
        });

        it('should throw NotFoundException if not found', async () => {
            mockPrismaService.entityType.findUnique.mockResolvedValue(null);

            await expect(repository.findById('et-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if belongs to different tenant', async () => {
            const otherTenantEntity = { ...mockEntityType, tenantId: 'other-tenant' };
            mockPrismaService.entityType.findUnique.mockResolvedValue(otherTenantEntity);

            await expect(repository.findById('et-1')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('update', () => {
        it('should update entity type after validating ownership', async () => {
            const dto = { displayName: 'Updated Project' };

            mockPrismaService.entityType.findUnique.mockResolvedValue(mockEntityType);
            mockPrismaService.entityType.update.mockResolvedValue({
                ...mockEntityType,
                ...dto,
            });

            const result = await repository.update('et-1', dto);

            expect(result.displayName).toBe('Updated Project');
            expect(mockPrismaService.entityType.findUnique).toHaveBeenCalled();
        });
    });

    describe('softDelete', () => {
        it('should set isActive to false', async () => {
            const deletedEntity = { ...mockEntityType, isActive: false };

            mockPrismaService.entityType.findUnique.mockResolvedValue(mockEntityType);
            mockPrismaService.entityType.update.mockResolvedValue(deletedEntity);

            const result = await repository.softDelete('et-1');

            expect(result.isActive).toBe(false);
            expect(mockPrismaService.entityType.update).toHaveBeenCalledWith({
                where: { id: 'et-1' },
                data: { isActive: false },
            });
        });
    });

    describe('existsByName', () => {
        it('should return true if name exists for tenant', async () => {
            mockPrismaService.entityType.count.mockResolvedValue(1);

            const result = await repository.existsByName('project');

            expect(result).toBe(true);
        });

        it('should exclude specified ID when checking', async () => {
            mockPrismaService.entityType.count.mockResolvedValue(0);

            await repository.existsByName('project', 'et-1');

            expect(mockPrismaService.entityType.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        id: { not: 'et-1' },
                    }),
                }),
            );
        });
    });
});
