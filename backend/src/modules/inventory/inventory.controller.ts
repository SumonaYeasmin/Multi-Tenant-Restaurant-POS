import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { GetIngredientsQueryDto } from './dto/get-ingredients-query.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('(Tenant) Inventory')
@Controller('tenants')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post(':tenantSlug/inventory/ingredients')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new ingredient / raw material',
    description:
      'Creates a new master ingredient for the tenant, initializes branch stock across branches, and records initial opening stock movement.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Ingredient created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant or branch not found' })
  @ApiResponse({
    status: 409,
    description: 'An ingredient with this name already exists',
  })
  async createIngredient(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateIngredientDto,
    @CurrentUser() user: any,
  ) {
    const ingredient = await this.inventoryService.createIngredient(
      tenantSlug,
      dto,
      user,
    );
    return ResponseHelper.created(
      ingredient,
      'Ingredient created successfully',
    );
  }

  @Get(':tenantSlug/inventory/ingredients')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all ingredients of the restaurant',
    description:
      'Retrieves all ingredients for the tenant with optional branch stock calculation, category filter, search, and low stock status.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Ingredients retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getIngredients(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetIngredientsQueryDto,
  ) {
    const ingredients = await this.inventoryService.getIngredients(
      tenantSlug,
      query,
    );
    return ResponseHelper.success(
      ingredients,
      'Ingredients retrieved successfully',
    );
  }

  @Get(':tenantSlug/inventory/ingredients/:ingredientId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific ingredient',
    description:
      'Retrieves a single ingredient by ID with branch stock breakdowns across all branches.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'ingredientId',
    example: 'uuid',
    description: 'Ingredient ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Ingredient retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  async getIngredientById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('ingredientId') ingredientId: string,
  ) {
    const ingredient = await this.inventoryService.getIngredientById(
      tenantSlug,
      ingredientId,
    );
    return ResponseHelper.success(
      ingredient,
      'Ingredient retrieved successfully',
    );
  }
}
