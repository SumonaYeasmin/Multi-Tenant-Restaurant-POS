import {
  Body,
  Controller,
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
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { GetMenuItemsQueryDto } from './dto/get-menu-items-query.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Menu Items')
@Controller('tenants')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post(':tenantSlug/menu-items')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new menu item',
    description:
      'Creates a new menu item with category, price, size variants, modifier groups, and branch-specific price overrides.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Menu item created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant or category not found' })
  @ApiResponse({
    status: 409,
    description: 'Menu item with this name already exists',
  })
  async createMenuItem(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    const item = await this.menuItemService.createMenuItem(tenantSlug, dto);
    return ResponseHelper.created(item, 'Menu item created successfully');
  }

  @Get(':tenantSlug/menu-items')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all menu items',
    description:
      'Retrieves all menu items for the restaurant with optional filtering by category, search, availability, or branch pricing.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu items retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getAllMenuItems(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetMenuItemsQueryDto,
  ) {
    const items = await this.menuItemService.getAllMenuItems(tenantSlug, query);
    return ResponseHelper.success(items, 'Menu items retrieved successfully');
  }

  @Get(':tenantSlug/menu-items/:itemId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific menu item',
    description:
      'Retrieves a single menu item with its category, size variants, and branch overrides.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'itemId',
    example: 'uuid',
    description: 'Menu item ID',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Optional branch ID to calculate effective branch price',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu item retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu item or restaurant not found',
  })
  async getMenuItemById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('itemId') itemId: string,
    @Query('branchId') branchId?: string,
  ) {
    const item = await this.menuItemService.getMenuItemById(
      tenantSlug,
      itemId,
      branchId,
    );
    return ResponseHelper.success(item, 'Menu item retrieved successfully');
  }

  @Put(':tenantSlug/menu-items/:itemId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a menu item',
    description:
      'Updates details of a menu item (name, description, price, category, variants, modifiers, branch overrides).',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'itemId',
    example: 'uuid',
    description: 'Menu item ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Menu item updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Menu item, restaurant or category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Menu item with this name already exists',
  })
  async updateMenuItem(
    @Param('tenantSlug') tenantSlug: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    const item = await this.menuItemService.updateMenuItem(
      tenantSlug,
      itemId,
      dto,
    );
    return ResponseHelper.success(item, 'Menu item updated successfully');
  }
}
