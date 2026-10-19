import {
  Body,
  Controller,
  Param,
  Post,
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
}
