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
import { GoodsReceiptService } from './goods-receipt.service';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('(Tenant) Goods Receiving')
@Controller('tenants')
export class GoodsReceiptController {
  constructor(
    private readonly goodsReceiptService: GoodsReceiptService,
  ) {}

  @Post(':tenantSlug/goods-receipts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PURCHASING_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Receive delivery against a purchase order',
    description:
      'Receives items from supplier delivery, increases BranchStock, logs StockMovement audit records, and updates Purchase Order status.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Goods received and inventory updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed, order in draft, or over-receiving quantity',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant or purchase order not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Purchase order already fully received or cancelled',
  })
  async receiveGoods(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: ReceiveGoodsDto,
    @CurrentUser() user: any,
  ) {
    const receipt = await this.goodsReceiptService.receiveGoods(
      tenantSlug,
      dto,
      user,
    );
    return ResponseHelper.created(
      receipt,
      'Goods received and inventory updated successfully',
    );
  }
}
