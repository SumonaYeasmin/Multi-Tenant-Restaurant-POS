import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { GetPurchaseOrdersQueryDto } from './dto/get-purchase-orders-query.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';
import { Prisma, PurchaseOrderStatus } from '../../../prisma/generated/client';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Format a PurchaseOrder for response including computed totalAmount
   * and compatibility aliases for frontend
   */
  private formatPurchaseOrder(po: any) {
    const totalAmount = (po.items ?? []).reduce(
      (sum: number, item: any) =>
        sum + (item.quantity ?? 0) * (item.unitCost ?? 0),
      0,
    );
    const roundedTotal = Math.round(totalAmount * 100) / 100;

    return {
      ...po,
      totalAmount: roundedTotal,
      // Compatibility fields for UI / frontend
      number: po.poNumber,
      supplierName: po.supplier?.name || '',
      expectedDate: po.expectedAt ? po.expectedAt.toISOString() : null,
      total: roundedTotal,
      lines: (po.items ?? []).map((item: any) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        name: item.ingredient?.name || '',
        unit: item.ingredient?.unit || '',
        qty: item.quantity,
        unitCost: item.unitCost,
        receivedQty: item.receivedQty ?? 0,
      })),
    };
  }

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

    return this.formatPurchaseOrder(purchaseOrder);
  }

  /**
   * Get all purchase orders for a tenant with optional branch, supplier, status, or search filters
   */
  async getPurchaseOrders(
    tenantSlug: string,
    query?: GetPurchaseOrdersQueryDto,
  ) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Build where conditions
    const where: Prisma.PurchaseOrderWhereInput = {
      restaurantId: tenant.id,
    };

    if (query?.branchId) {
      where.branchId = query.branchId;
    }

    if (query?.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search?.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { poNumber: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
        { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    // 3. Fetch purchase orders ordered by creation descending
    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        _count: {
          select: {
            items: true,
            goodsReceipts: true,
          },
        },
      },
    });

    return orders.map((o) => this.formatPurchaseOrder(o));
  }

  /**
   * Get single purchase order details by ID
   */
  async getPurchaseOrderById(tenantSlug: string, id: string) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Fetch specific purchase order
    const order = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        restaurantId: tenant.id,
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
        goodsReceipts: {
          include: {
            lines: true,
          },
        },
        _count: {
          select: {
            items: true,
            goodsReceipts: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Purchase order');
    }

    return this.formatPurchaseOrder(order);
  }
}
