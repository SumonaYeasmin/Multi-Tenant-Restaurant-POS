import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderLineDto } from './dto/create-order-line.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import {
  KitchenStatus,
  OrderStatus,
  OrderType,
  Prisma,
  TableStatus,
} from '../../../prisma/generated/client';
import { NotFoundException } from '../../common/exceptions/business.exception';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Round number to 2 decimal places
   */
  private round2(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * Helper: Generate incremental daily order number (e.g. #1001, #1002)
   */
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrderCount = await this.prisma.order.count({
      where: {
        tenantId,
        createdAt: { gte: today },
      },
    });

    return `#${1001 + todayOrderCount}`;
  }

  /**
   * Create a new order (Supports both "Send" and "Send & Pay")
   */
  async createOrder(tenantSlug: string, dto: CreateOrderDto) {
    // 1. Verify tenant exists and fetch tax & service charge rates
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Verify branch belongs to this tenant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: dto.branchId,
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch');
    }

    // 3. Validation for specific order types
    let tableName = dto.tableName;
    if (dto.type === OrderType.DINE_IN) {
      if (dto.tableId) {
        const table = await this.prisma.diningTable.findFirst({
          where: {
            id: dto.tableId,
            tenantId: tenant.id,
            branchId: branch.id,
            isDeleted: false,
          },
        });

        if (!table) {
          throw new NotFoundException('Dining table');
        }

        tableName = tableName || table.name;
      }
    } else if (dto.type === OrderType.DELIVERY) {
      if (!dto.deliveryAddress?.trim() || !dto.customerPhone?.trim()) {
        throw new BadRequestException(
          'Delivery order requires customer phone number and delivery address',
        );
      }
    }

    // 4. Calculate Subtotal, Discount, Service Charge, Tax, and Grand Total
    const subtotal = this.round2(
      dto.lines.reduce((total, line) => {
        const modifiersCost = (line.modifiers || []).reduce(
          (mSum, m) => mSum + Number(m.price || 0),
          0,
        );
        return (
          total +
          (Number(line.unitPrice) + modifiersCost) * Number(line.qty)
        );
      }, 0),
    );

    let discountAmount = 0;
    if (dto.discount && dto.discount.value > 0) {
      discountAmount =
        dto.discount.kind === 'percent'
          ? (subtotal * Math.min(dto.discount.value, 100)) / 100
          : dto.discount.value;
    }
    discountAmount = this.round2(Math.min(discountAmount, subtotal));

    const netAmount = subtotal - discountAmount;

    // Service charge applies to Dine-in orders
    const serviceCharge =
      dto.type === OrderType.DINE_IN
        ? this.round2(netAmount * (tenant.serviceChargeRate || 0))
        : 0;

    const tax = this.round2(
      (netAmount + serviceCharge) * (tenant.taxRate || 0),
    );

    const grandTotal = this.round2(netAmount + serviceCharge + tax);

    // 5. Generate human-readable Order Number
    const orderNumber = await this.generateOrderNumber(tenant.id);

    // 6. Execute atomic Prisma Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // A. Create the Order with nested OrderLines and Modifiers
      const createdOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          orderNumber,
          type: dto.type,
          tableId: dto.tableId || null,
          tableName: tableName || null,
          customerName: dto.customerName?.trim() || '',
          customerPhone: dto.customerPhone?.trim() || '',
          deliveryAddress: dto.deliveryAddress?.trim() || null,
          notes: dto.notes?.trim() || '',
          createdBy: dto.createdBy?.trim() || '',
          status: OrderStatus.IN_KITCHEN,
          kitchenStatus: KitchenStatus.NEW,
          subtotal,
          discount: discountAmount,
          discountKind: dto.discount?.kind || null,
          discountReason: dto.discount?.reason || null,
          promoCode: dto.discount?.promoCode || null,
          serviceCharge,
          tax,
          total: grandTotal,
          paid: dto.payment ? dto.payment.amount : 0.0,

          // Nested create for Order Lines and their Modifiers
          lines: {
            create: dto.lines.map((line) => ({
              menuItemId: line.menuItemId || line.itemId || null,
              name: line.name,
              variantId: line.variantId || null,
              variantName: line.variantName || null,
              qty: line.qty,
              unitPrice: line.unitPrice,
              notes: line.notes || '',
              modifiers: line.modifiers?.length
                ? {
                    create: line.modifiers.map((m) => ({
                      groupId: m.groupId || null,
                      optionId: m.optionId || null,
                      name: m.name,
                      price: m.price,
                    })),
                  }
                : undefined,
            })),
          },

          // Nested create for Payment if "Send & Pay" was clicked
          payments: dto.payment
            ? {
                create: {
                  method: dto.payment.method,
                  amount: dto.payment.amount,
                  tendered: dto.payment.tendered ?? dto.payment.amount,
                  change: dto.payment.change ?? 0,
                  reference: dto.payment.reference ?? '',
                },
              }
            : undefined,
        },
        include: {
          lines: {
            include: {
              modifiers: true,
            },
          },
          payments: true,
          table: true,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // B. If Dine-in with tableId, mark table as OCCUPIED and link current order
      if (dto.type === OrderType.DINE_IN && dto.tableId) {
        await tx.diningTable.update({
          where: { id: dto.tableId },
          data: {
            status: TableStatus.OCCUPIED,
            currentOrderId: createdOrder.id,
          },
        });
      }

      return createdOrder;
    });

    return order;
  }

  /**
   * Get all orders with flexible filters (branch, status, kitchenStatus, type, search, date)
   */
  async getOrders(tenantSlug: string, query?: GetOrdersQueryDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Build where filter
    const where: Prisma.OrderWhereInput = {
      tenantId: tenant.id,
    };

    if (query?.branchId) {
      where.branchId = query.branchId;
    }

    // 3. Status handling (active, all, in_kitchen, ready, served, completed, cancelled)
    if (query?.status) {
      const s = query.status.toLowerCase().trim();
      if (s === 'active') {
        // "active" orders for POS & Floor management
        where.status = {
          in: [OrderStatus.IN_KITCHEN, OrderStatus.READY, OrderStatus.SERVED],
        };
      } else if (s !== 'all') {
        // Map string to OrderStatus enum (case-insensitive & handles hyphen/underscore)
        const upper = s.toUpperCase().replace('-', '_');
        if (Object.values(OrderStatus).includes(upper as OrderStatus)) {
          where.status = upper as OrderStatus;
        }
      }
    }

    // 4. Kitchen status handling (NEW, PREPARING, READY, BUMPED)
    if (query?.kitchenStatus) {
      const ks = query.kitchenStatus.toUpperCase().replace('-', '_');
      if (Object.values(KitchenStatus).includes(ks as KitchenStatus)) {
        where.kitchenStatus = ks as KitchenStatus;
      }
    }

    // 5. Order Type handling (DINE_IN, TAKEAWAY, PICKUP, COUNTER, DELIVERY)
    if (query?.type) {
      const ot = query.type.toUpperCase().replace('-', '_');
      if (Object.values(OrderType).includes(ot as OrderType)) {
        where.type = ot as OrderType;
      }
    }

    // 6. Dining Table filter
    if (query?.tableId) {
      where.tableId = query.tableId;
    }

    // 7. Search query across order number, customer name, customer phone, table name
    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { customerName: { contains: term, mode: 'insensitive' } },
        { customerPhone: { contains: term, mode: 'insensitive' } },
        { tableName: { contains: term, mode: 'insensitive' } },
      ];
    }

    // 8. Date range filters
    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 9. Fetch orders with all necessary relations ordered newest to oldest
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.limit ? Number(query.limit) : undefined,
      include: {
        lines: {
          include: {
            modifiers: true,
          },
        },
        payments: true,
        refunds: true,
        table: {
          select: {
            id: true,
            name: true,
            area: true,
            seats: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return orders;
  }

  /**
   * Get single order by ID with complete details
   */
  async getOrderById(tenantSlug: string, orderId: string) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Fetch order with lines, modifiers, payments, refunds and table
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId: tenant.id,
      },
      include: {
        lines: {
          include: {
            modifiers: true,
          },
        },
        payments: true,
        refunds: true,
        table: {
          select: {
            id: true,
            name: true,
            area: true,
            seats: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order');
    }

    return order;
  }

  /**
   * Add new items/lines to an existing active order (Running Order / Add-on)
   */
  async addOrderLines(
    tenantSlug: string,
    orderId: string,
    newLines: CreateOrderLineDto[],
  ) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Fetch existing order
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId: tenant.id,
      },
      include: {
        lines: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order');
    }

    if (
      existingOrder.status === OrderStatus.COMPLETED ||
      existingOrder.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot add items to a completed or cancelled order',
      );
    }

    if (!newLines || newLines.length === 0) {
      throw new BadRequestException('At least one line item is required');
    }

    // 3. Compute cost of new lines
    const addedSubtotal = this.round2(
      newLines.reduce((total, line) => {
        const modifiersCost = (line.modifiers || []).reduce(
          (mSum, m) => mSum + Number(m.price || 0),
          0,
        );
        return (
          total +
          (Number(line.unitPrice) + modifiersCost) * Number(line.qty)
        );
      }, 0),
    );

    const newSubtotal = this.round2(existingOrder.subtotal + addedSubtotal);

    let discountAmount = existingOrder.discount;
    discountAmount = this.round2(Math.min(discountAmount, newSubtotal));

    const netAmount = newSubtotal - discountAmount;
    const serviceCharge =
      existingOrder.type === OrderType.DINE_IN
        ? this.round2(netAmount * (tenant.serviceChargeRate || 0))
        : 0;

    const tax = this.round2(
      (netAmount + serviceCharge) * (tenant.taxRate || 0),
    );

    const grandTotal = this.round2(netAmount + serviceCharge + tax);

    // 4. Save new lines and update order totals in a transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Create new lines and their modifiers
      for (const line of newLines) {
        await tx.orderLine.create({
          data: {
            orderId: existingOrder.id,
            menuItemId: line.menuItemId || line.itemId || null,
            name: line.name,
            variantId: line.variantId || null,
            variantName: line.variantName || null,
            qty: line.qty,
            unitPrice: line.unitPrice,
            notes: line.notes || '',
            modifiers: line.modifiers?.length
              ? {
                  create: line.modifiers.map((m) => ({
                    groupId: m.groupId || null,
                    optionId: m.optionId || null,
                    name: m.name,
                    price: m.price,
                  })),
                }
              : undefined,
          },
        });
      }

      // Update Order totals and set kitchenStatus to NEW
      return tx.order.update({
        where: { id: existingOrder.id },
        data: {
          subtotal: newSubtotal,
          discount: discountAmount,
          serviceCharge,
          tax,
          total: grandTotal,
          kitchenStatus: KitchenStatus.NEW,
          sentToKitchenAt: new Date(),
        },
        include: {
          lines: {
            include: {
              modifiers: true,
            },
          },
          payments: true,
          refunds: true,
          table: true,
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return updatedOrder;
  }

  /**
   * Advance kitchen ticket status (NEW -> PREPARING -> READY -> BUMPED)
   */
  async advanceKitchenStatus(tenantSlug: string, orderId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) throw new NotFoundException('Restaurant');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.id },
    });
    if (!order) throw new NotFoundException('Order');

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update status of a cancelled order');
    }

    const KITCHEN_FLOW: Record<KitchenStatus, KitchenStatus | null> = {
      [KitchenStatus.NEW]: KitchenStatus.PREPARING,
      [KitchenStatus.PREPARING]: KitchenStatus.READY,
      [KitchenStatus.READY]: KitchenStatus.BUMPED,
      [KitchenStatus.BUMPED]: null,
    };

    const nextStatus = KITCHEN_FLOW[order.kitchenStatus];
    if (!nextStatus) {
      throw new BadRequestException('Kitchen ticket already bumped');
    }

    const updateData: Prisma.OrderUpdateInput = {
      kitchenStatus: nextStatus,
    };

    if (nextStatus === KitchenStatus.READY) {
      updateData.readyAt = new Date();
      if (order.status === OrderStatus.IN_KITCHEN) {
        updateData.status = OrderStatus.READY;
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        lines: { include: { modifiers: true } },
        table: true,
        branch: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Mark order as SERVED (Food delivered to table by waiter)
   */
  async markOrderServed(tenantSlug: string, orderId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) throw new NotFoundException('Restaurant');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.id },
    });
    if (!order) throw new NotFoundException('Order');

    const updateData: Prisma.OrderUpdateInput = {
      status: OrderStatus.SERVED,
    };

    if (order.kitchenStatus === KitchenStatus.READY) {
      updateData.kitchenStatus = KitchenStatus.BUMPED;
    }

    if (order.paid >= order.total && order.total > 0) {
      updateData.status = OrderStatus.COMPLETED;
      updateData.completedAt = new Date();

      if (order.tableId) {
        await this.prisma.diningTable.update({
          where: { id: order.tableId },
          data: {
            status: TableStatus.CLEANING,
            currentOrderId: null,
          },
        });
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        lines: { include: { modifiers: true } },
        table: true,
        branch: { select: { id: true, name: true } },
      },
    });
  }
}
