import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
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
}
