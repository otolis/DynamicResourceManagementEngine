import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../security/guards/rbac.guard';
import { RequirePermission } from '../security/decorators/require-permission.decorator';
import {
    CreateAttributeDto,
    UpdateAttributeDto,
    SearchAttributeDto,
    BulkCreateAttributeDto,
    AttributeResponseDto,
    AttributeListResponseDto,
    BulkCreateAttributeResponseDto,
    CreateAttributeOptionDto,
    UpdateAttributeOptionDto,
    AttributeOptionResponseDto,
} from './dto';

/**
 * Controller for Attribute CRUD operations and Option management.
 * All endpoints require JWT authentication and RBAC permissions.
 */
@Controller('attributes')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AttributeController {
    constructor(private readonly attributeService: AttributeService) {}

    /**
     * Create a new attribute.
     * POST /attributes
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission('attribute', 'create')
    async create(
        @Body() dto: CreateAttributeDto,
    ): Promise<AttributeResponseDto> {
        return this.attributeService.create(dto);
    }

    /**
     * Get all attributes with pagination and filtering.
     * GET /attributes
     */
    @Get()
    @RequirePermission('attribute', 'read')
    async findAll(
        @Query() searchDto: SearchAttributeDto,
    ): Promise<AttributeListResponseDto> {
        return this.attributeService.findAll(searchDto);
    }

    /**
     * Get attribute by ID.
     * GET /attributes/:id
     */
    @Get(':id')
    @RequirePermission('attribute', 'read')
    async findById(@Param('id') id: string): Promise<AttributeResponseDto> {
        return this.attributeService.findById(id);
    }

    /**
     * Update attribute.
     * PUT /attributes/:id
     */
    @Put(':id')
    @RequirePermission('attribute', 'update')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateAttributeDto,
    ): Promise<AttributeResponseDto> {
        return this.attributeService.update(id, dto);
    }

    /**
     * Delete attribute.
     * DELETE /attributes/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermission('attribute', 'delete')
    async delete(@Param('id') id: string): Promise<void> {
        return this.attributeService.delete(id);
    }

    /**
     * Bulk create attributes.
     * POST /attributes/bulk
     */
    @Post('bulk')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission('attribute', 'create')
    async bulkCreate(
        @Body() dto: BulkCreateAttributeDto,
    ): Promise<BulkCreateAttributeResponseDto> {
        return this.attributeService.bulkCreate(dto);
    }

    /**
     * Add option to ENUM attribute.
     * POST /attributes/:id/options
     */
    @Post(':id/options')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission('attribute', 'update')
    async addOption(
        @Param('id') id: string,
        @Body() dto: CreateAttributeOptionDto,
    ): Promise<AttributeOptionResponseDto> {
        return this.attributeService.addOption(id, dto);
    }

    /**
     * Update attribute option.
     * PUT /attributes/:id/options/:optionId
     */
    @Put(':id/options/:optionId')
    @RequirePermission('attribute', 'update')
    async updateOption(
        @Param('id') id: string,
        @Param('optionId') optionId: string,
        @Body() dto: UpdateAttributeOptionDto,
    ): Promise<AttributeOptionResponseDto> {
        return this.attributeService.updateOption(id, optionId, dto);
    }

    /**
     * Delete attribute option.
     * DELETE /attributes/:id/options/:optionId
     */
    @Delete(':id/options/:optionId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @RequirePermission('attribute', 'update')
    async deleteOption(
        @Param('id') id: string,
        @Param('optionId') optionId: string,
    ): Promise<void> {
        return this.attributeService.deleteOption(id, optionId);
    }
}
