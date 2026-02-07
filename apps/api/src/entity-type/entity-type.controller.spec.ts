import { Test, TestingModule } from '@nestjs/testing';
import { EntityTypeController } from './entity-type.controller';
import { EntityTypeService } from './entity-type.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../security/guards/rbac.guard';
import { CreateEntityTypeDto, SearchEntityTypeDto } from './dto';

describe('EntityTypeController', () => {
    let controller: EntityTypeController;
    let service: EntityTypeService;

    const mockService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findByIdWithRelations: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        bulkCreate: jest.fn(),
    };

    const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
    const mockRbacGuard = { canActivate: jest.fn(() => true) };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EntityTypeController],
            providers: [{ provide: EntityTypeService, useValue: mockService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(mockJwtAuthGuard)
            .overrideGuard(RbacGuard)
            .useValue(mockRbacGuard)
            .compile();

        controller = module.get<EntityTypeController>(EntityTypeController);
        service = module.get<EntityTypeService>(EntityTypeService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should call service.create with DTO', async () => {
            const dto: CreateEntityTypeDto = {
                name: 'project',
                displayName: 'Project',
            };
            const expected = { id: 'et-1', ...dto };

            mockService.create.mockResolvedValue(expected);

            const result = await controller.create(dto);

            expect(service.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(expected);
        });
    });

    describe('findAll', () => {
        it('should pass query parameters to service', async () => {
            const query: SearchEntityTypeDto = {
                search: 'project',
                page: 1,
                limit: 10,
            };
            const expected = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };

            mockService.findAll.mockResolvedValue(expected);

            const result = await controller.findAll(query);

            expect(service.findAll).toHaveBeenCalledWith(query);
            expect(result).toEqual(expected);
        });
    });

    describe('findById', () => {
        it('should call service.findById with ID', async () => {
            const id = 'et-1';
            const expected = { id, name: 'project' };

            mockService.findById.mockResolvedValue(expected);

            const result = await controller.findById(id);

            expect(service.findById).toHaveBeenCalledWith(id);
            expect(result).toEqual(expected);
        });
    });

    describe('update', () => {
        it('should call service.update with ID and DTO', async () => {
            const id = 'et-1';
            const dto = { displayName: 'Updated' };
            const expected = { id, ...dto };

            mockService.update.mockResolvedValue(expected);

            const result = await controller.update(id, dto);

            expect(service.update).toHaveBeenCalledWith(id, dto);
            expect(result).toEqual(expected);
        });
    });

    describe('delete', () => {
        it('should call service.softDelete', async () => {
            const id = 'et-1';
            const expected = { id, isActive: false };

            mockService.softDelete.mockResolvedValue(expected);

            const result = await controller.delete(id);

            expect(service.softDelete).toHaveBeenCalledWith(id);
            expect(result).toEqual(expected);
        });
    });
});
