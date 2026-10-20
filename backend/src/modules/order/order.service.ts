import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  KitchenStatus,
  OrderStatus,
  OrderType,
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
}
