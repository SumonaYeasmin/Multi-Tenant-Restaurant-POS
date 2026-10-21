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
import { StockCountService } from './stock-count.service';
import { SubmitStockCountDto } from './dto/submit-stock-count.dto';
import { GetStockCountsQueryDto } from './dto/get-stock-counts-query.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('(Tenant) Stock Counts')
@Controller('tenants')
export class StockCountController {
  constructor(private readonly stockCountService: StockCountService) {}

  @Post(':tenantSlug/inventory/stock-counts')
  @Post(':tenantSlug/stock-counts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit physical stock count and reconcile inventory',
    description:
      'Creates a stock count record, calculates variances, updates live BranchStock, and creates audit StockMovement logs for any discrepancies.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock count submitted and inventory reconciled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid ingredient quantity',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant or branch not found' })
  async submitStockCount(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: SubmitStockCountDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.stockCountService.submitStockCount(
      tenantSlug,
      dto,
      user,
    );
    return ResponseHelper.created(
      result,
      'Stock count submitted and inventory reconciled successfully',
    );
  }

  @Get(':tenantSlug/inventory/stock-counts')
  @Get(':tenantSlug/stock-counts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get stock counts history for a tenant with optional branch filter',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock counts retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getStockCounts(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetStockCountsQueryDto,
  ) {
    const result = await this.stockCountService.getStockCounts(
      tenantSlug,
      query,
    );
    return ResponseHelper.success(
      result.items,
      'Stock counts retrieved successfully',
      200,
    );
  }

  @Get(':tenantSlug/inventory/stock-counts/:id')
  @Get(':tenantSlug/stock-counts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a single stock count by ID',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'id',
    example: 'uuid',
    description: 'Stock count ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock count retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Stock count not found' })
  async getStockCountById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const result = await this.stockCountService.getStockCountById(
      tenantSlug,
      id,
    );
    return ResponseHelper.success(
      result,
      'Stock count retrieved successfully',
    );
  }
}
