import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { EntityTypeService } from './entity-type.service';
import { EntityTypeRepository } from './entity-type.repository';
import { CreateEntityTypeDto, BulkCreateEntityTypeDto } from './dto';

describe('EntityTypeService', () => {
    let service: EntityTypeService;
    let repository: EntityTypeRepository;

    const mockEntityType = {
        id: 'et-1',
        tenantId: 'tenant-123',
        name: 'project',
        displayName: 'Project',
        description: 'Project entity',
        iconName: 'folder',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockRepository = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findByIdWithRelations: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        existsByName: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EntityTypeService,
                { provide: EntityTypeRepository, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<EntityTypeService>(EntityTypeService);
        repository = module.get<EntityTypeRepository>(EntityTypeRepository);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create entity type after validating uniqueness', async () => {
            const dto: CreateEntityTypeDto = {
                name: 'project',
                displayName: 'Project',
            };

            mockRepository.existsByName.mockResolvedValue(false);
            mockRepository.create.mockResolvedValue(mockEntityType);

            const result = await service.create(dto);

            expect(mockRepository.existsByName).toHaveBeenCalledWith('project');
            expect(mockRepository.create).toHaveBeenCalledWith(dto);
            expect(result.id).toBe('et-1');
        });

        it('should throw ConflictException if name already exists', async () => {
            const dto: CreateEntityTypeDto = {
                name: 'project',
                displayName: 'Project',
            };

            mockRepository.existsByName.mockResolvedValue(true);

            await expect(service.create(dto)).rejects.toThrow(ConflictException);
            expect(mockRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return paginated response with metadata', async () => {
            const searchDto = { page: 1, limit: 10 };
            mockRepository.findAll.mockResolvedValue({
                data: [mockEntityType],
                total: 1,
            });

            const result = await service.findAll(searchDto);

            expect(result.data).toHaveLength(1);
            expect(result.meta).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            });
        });
    });

    describe('update', () => {
        it('should validate name uniqueness when changing name', async () => {
            const dto = { name: 'new_project' };

            mockRepository.existsByName.mockResolvedValue(false);
            mockRepository.update.mockResolvedValue({
                ...mockEntityType,
                ...dto,
            });

            await service.update('et-1', dto);

            expect(mockRepository.existsByName).toHaveBeenCalledWith('new_project', 'et-1');
        });

        it('should skip uniqueness check if name not changing', async () => {
            const dto = { displayName: 'Updated Project' };

            mockRepository.update.mockResolvedValue({
                ...mockEntityType,
                ...dto,
            });

            await service.update('et-1', dto);

            expect(mockRepository.existsByName).not.toHaveBeenCalled();
        });
    });

    describe('bulkCreate', () => {
        it('should create multiple entity types and report results', async () => {
            const dto: BulkCreateEntityTypeDto = {
                entityTypes: [
                    { name: 'project', displayName: 'Project' },
                    { name: 'task', displayName: 'Task' },
                ],
            };

            mockRepository.existsByName.mockResolvedValue(false);
            mockRepository.create
                .mockResolvedValueOnce({ ...mockEntityType, name: 'project' })
                .mockResolvedValueOnce({ ...mockEntityType, name: 'task', id: 'et-2' });

            const result = await service.bulkCreate(dto);

            expect(result.summary).toEqual({
                total: 2,
                successful: 2,
                failed: 0,
            });
            expect(result.created).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
        });

        it('should handle partial failures', async () => {
            const dto: BulkCreateEntityTypeDto = {
                entityTypes: [
                    { name: 'project', displayName: 'Project' },
                    { name: 'project', displayName: 'Duplicate' }, // Will fail
                ],
            };

            mockRepository.existsByName
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(true);
            mockRepository.create.mockResolvedValueOnce(mockEntityType);

            const result = await service.bulkCreate(dto);

            expect(result.summary).toEqual({
                total: 2,
                successful: 1,
                failed: 1,
            });
            expect(result.failed[0]).toMatchObject({
                index: 1,
                error: expect.stringContaining('already exists'),
            });
        });
    });
});
