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
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('(Tenant) Purchase Orders')
@Controller('tenants')
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
  ) {}

  @Post(':tenantSlug/purchase-orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PURCHASING_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new purchase order',
    description:
      'Creates a new purchase order selecting a supplier, branch, and items with quantities and unit costs.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or inactive supplier / invalid items',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant, branch, or supplier not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Purchase order with this PO number already exists',
  })
  async createPurchaseOrder(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    const order = await this.purchaseOrderService.createPurchaseOrder(
      tenantSlug,
      dto,
      user,
    );
    return ResponseHelper.created(
      order,
      'Purchase order created successfully',
    );
  }
}
