import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Menu Categories')
@Controller('tenants')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post(':tenantSlug/categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new menu category',
    description: 'Creates a category to group menu items for the restaurant tenant.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  async createCategory(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.categoryService.createCategory(tenantSlug, dto);
    return ResponseHelper.created(category, 'Category created successfully');
  }

  @Get(':tenantSlug/categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all categories of the restaurant',
    description: 'Retrieves all menu categories for the restaurant, sorted in display order for POS/Menu tabs.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter only active categories (useful for POS screen)',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getAllCategories(
    @Param('tenantSlug') tenantSlug: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    const categories = await this.categoryService.getAllCategories(
      tenantSlug,
      activeOnly,
    );
    return ResponseHelper.success(categories, 'Categories retrieved successfully');
  }

  @Get(':tenantSlug/categories/:categoryId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific category',
    description: 'Retrieves a single category by its ID.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'categoryId',
    example: 'uuid',
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category or restaurant not found' })
  async getCategoryById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('categoryId') categoryId: string,
  ) {
    const category = await this.categoryService.getCategoryById(
      tenantSlug,
      categoryId,
    );
    return ResponseHelper.success(category, 'Category retrieved successfully');
  }

  @Put(':tenantSlug/categories/:categoryId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update category details or active status',
    description: 'Updates category name, description, sort order, or active status.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'categoryId',
    example: 'uuid',
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category or restaurant not found' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  async updateCategory(
    @Param('tenantSlug') tenantSlug: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.updateCategory(
      tenantSlug,
      categoryId,
      dto,
    );
    return ResponseHelper.success(category, 'Category updated successfully');
  }

  @Delete(':tenantSlug/categories/:categoryId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a menu category',
    description: 'Permanently deletes a category from the restaurant tenant.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'categoryId',
    example: 'uuid',
    description: 'Category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category or restaurant not found' })
  async deleteCategory(
    @Param('tenantSlug') tenantSlug: string,
    @Param('categoryId') categoryId: string,
  ) {
    const result = await this.categoryService.deleteCategory(
      tenantSlug,
      categoryId,
    );
    return ResponseHelper.success(result, 'Category deleted successfully');
  }
}
