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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderLineDto } from './dto/create-order-line.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Orders & POS')
@Controller('tenants')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post(':tenantSlug/orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ORDERS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new order (POS Send / Send & Pay)',
    description:
      'Creates a new order with items, variants, modifiers, calculates tax and service charge, updates table status, and optionally handles immediate payment.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully and sent to kitchen',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant or branch not found' })
  async createOrder(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateOrderDto,
  ) {
    const order = await this.orderService.createOrder(tenantSlug, dto);
    return ResponseHelper.created(
      order,
      `Order ${order.orderNumber} created successfully`,
    );
  }

  @Get(':tenantSlug/orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ORDERS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all orders with status and search filters',
    description:
      'Retrieves orders for POS, Kitchen Display System (KDS), or Orders list filtered by status (active, all, in_kitchen, etc.), branch, table, or search query.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getOrders(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetOrdersQueryDto,
  ) {
    const orders = await this.orderService.getOrders(tenantSlug, query);
    return ResponseHelper.success(orders, 'Orders retrieved successfully');
  }

  @Get(':tenantSlug/orders/:orderId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ORDERS_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific order',
    description:
      'Retrieves complete order details including lines, modifiers, payments, refunds, and table details.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'orderId',
    example: 'uuid',
    description: 'Order ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order or restaurant not found' })
  async getOrderById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.orderService.getOrderById(tenantSlug, orderId);
    return ResponseHelper.success(order, 'Order retrieved successfully');
  }

  @Post(':tenantSlug/orders/:orderId/lines')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ORDERS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add more items to an active order (Running Order / Add-on)',
    description:
      'Adds additional line items and modifiers to an existing dining table or running order, re-computes subtotal, tax and total, and resets kitchen ticket to NEW.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'orderId',
    example: 'uuid',
    description: 'Order ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Items added to order successfully and sent to kitchen',
  })
  @ApiResponse({ status: 400, description: 'Order completed or cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async addOrderLines(
    @Param('tenantSlug') tenantSlug: string,
    @Param('orderId') orderId: string,
    @Body() lines: CreateOrderLineDto[],
  ) {
    const order = await this.orderService.addOrderLines(
      tenantSlug,
      orderId,
      lines,
    );
    return ResponseHelper.success(
      order,
      `Items added to order ${order.orderNumber} successfully`,
    );
  }
}
