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
import { StockMovementService } from './stock-movement.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { GetMovementsQueryDto } from './dto/get-movements-query.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('(Tenant) Stock Movements')
@Controller('tenants')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Post(':tenantSlug/inventory/adjust')
  @Post(':tenantSlug/stock-movements/adjust')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Adjust stock quantity (add, remove, or waste) for an ingredient',
    description:
      'Increases or decreases branch stock for an ingredient and records an atomic stock movement entry with audit information.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or insufficient stock',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Ingredient, branch or restaurant not found',
  })
  async adjustStock(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.stockMovementService.adjustStock(
      tenantSlug,
      dto,
      user,
    );
    return ResponseHelper.success(result, 'Stock adjusted successfully');
  }

  @Get(':tenantSlug/inventory/movements')
  @Get(':tenantSlug/stock-movements')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get stock movement audit history',
    description:
      'Retrieves the chronological audit ledger of all stock changes (sales, adjustments, waste, counts, deliveries) with filtering.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock movements retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getMovements(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetMovementsQueryDto,
  ) {
    const movements = await this.stockMovementService.getMovements(
      tenantSlug,
      query,
    );
    return ResponseHelper.success(
      movements,
      'Stock movements retrieved successfully',
    );
  }
}
