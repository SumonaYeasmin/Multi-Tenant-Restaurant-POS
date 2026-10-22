import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';
import { Prisma, PurchaseOrderStatus } from '../../../prisma/generated/client';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Generate unique, sequential PO number per restaurant
   * Format: PO-YYYYMMDD-001
   */
  private async generatePoNumber(
    restaurantId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const client = tx ?? this.prisma;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const startOfDay = new Date(yyyy, now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(
      yyyy,
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const countToday = await client.purchaseOrder.count({
      where: {
        restaurantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const serial = String(countToday + 1).padStart(3, '0');
    return `PO-${dateStr}-${serial}`;
  }

  /**
   * Create a new Purchase Order with items, quantities, and unit costs
   */
  async createPurchaseOrder(
    tenantSlug: string,
    dto: CreatePurchaseOrderDto,
    user?: any,
  ) {
    // 1. Verify tenant / restaurant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Verify branch exists for this restaurant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: dto.branchId,
        tenantId: tenant.id,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch');
    }

    // 3. Verify supplier exists and is active
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: dto.supplierId,
        tenantId: tenant.id,
        isDeleted: false,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier');
    }

    if (!supplier.active) {
      throw new BadRequestException(
        'This supplier is inactive and cannot receive new purchase orders',
      );
    }

    // 4. Normalize and validate items list
    const rawItems = dto.items ?? dto.lines ?? [];
    if (!rawItems.length) {
      throw new BadRequestException(
        'Purchase order must contain at least one item',
      );
    }

    const items = rawItems.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: Number(item.quantity ?? item.qty ?? 0),
      unitCost: Number(item.unitCost ?? 0),
    }));

    for (const item of items) {
      if (!item.ingredientId) {
        throw new BadRequestException('Each item must specify an ingredientId');
      }
      if (item.quantity <= 0) {
        throw new BadRequestException(
          'Each item quantity must be greater than zero',
        );
      }
      if (item.unitCost < 0) {
        throw new BadRequestException(
          'Each item unit cost must be zero or positive',
        );
      }
    }

    // Check for duplicate ingredients
    const ingredientIds = items.map((i) => i.ingredientId);
    if (new Set(ingredientIds).size !== items.length) {
      throw new BadRequestException(
        'Each ingredient can appear only once in a purchase order',
      );
    }

    // 5. Verify all ingredients exist for this tenant
    const existingIngredients = await this.prisma.ingredient.findMany({
      where: {
        id: { in: ingredientIds },
        tenantId: tenant.id,
        isDeleted: false,
      },
    });

    if (existingIngredients.length !== items.length) {
      throw new BadRequestException(
        'One or more ingredients do not exist or have been deleted',
      );
    }

    // 6. Resolve PO Number and verify uniqueness
    let poNumber = dto.poNumber?.trim();
    if (poNumber) {
      const existingPo = await this.prisma.purchaseOrder.findUnique({
        where: {
          restaurantId_poNumber: {
            restaurantId: tenant.id,
            poNumber,
          },
        },
      });

      if (existingPo) {
        throw new AlreadyExistsException(
          `A purchase order with number "${poNumber}"`,
        );
      }
    }

    // Resolve creator ID
    const createdById =
      user?.id || user?.sub || user?.userId || 'system';

    // Resolve expected date
    const expectedAtDate = dto.expectedAt
      ? new Date(dto.expectedAt)
      : dto.expectedDate
        ? new Date(dto.expectedDate)
        : null;

    // 7. Atomically create Purchase Order and its items in transaction
    const purchaseOrder = await this.prisma.$transaction(async (tx) => {
      if (!poNumber) {
        poNumber = await this.generatePoNumber(tenant.id, tx);
      }

      return tx.purchaseOrder.create({
        data: {
          restaurantId: tenant.id,
          branchId: branch.id,
          supplierId: supplier.id,
          createdById,
          poNumber,
          status: dto.status ?? PurchaseOrderStatus.DRAFT,
          notes: dto.notes?.trim() || null,
          expectedAt: expectedAtDate,
          items: {
            create: items.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              unitCost: item.unitCost,
            })),
          },
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              contact: true,
              phone: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  category: true,
                },
              },
            },
          },
        },
      });
    });

    // 8. Calculate total order value
    const totalAmount = purchaseOrder.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    return {
      ...purchaseOrder,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }
}
