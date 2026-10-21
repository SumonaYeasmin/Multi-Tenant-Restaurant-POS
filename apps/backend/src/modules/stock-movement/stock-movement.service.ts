import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { GetMovementsQueryDto } from './dto/get-movements-query.dto';
import { NotFoundException } from '../../common/exceptions/business.exception';
import { MovementReason, Prisma } from '../../../prisma/generated/client';

@Injectable()
export class StockMovementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adjust stock for an ingredient at a specific branch (increase, decrease, or waste)
   * and record an atomic stock movement audit log.
   */
  async adjustStock(
    tenantSlug: string,
    dto: AdjustStockDto,
    currentUser?: any,
  ) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const qty = dto.qty ?? dto.quantity;
    if (!qty || qty <= 0) {
      throw new BadRequestException(
        'Adjustment quantity must be greater than zero',
      );
    }

    // 2. Verify ingredient exists for this tenant
    const ingredient = await this.prisma.ingredient.findFirst({
      where: {
        id: dto.ingredientId,
        tenantId: tenant.id,
        isDeleted: false,
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient');
    }

    // 3. Verify branch exists for this tenant
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

    // 4. Determine movement reason & signed quantity change
    const isWaste = dto.reason?.toLowerCase() === 'waste';
    const direction = dto.direction ?? (isWaste ? 'remove' : 'add');
    const signedQty = direction === 'add' && !isWaste ? qty : -qty;

    const movementReason: MovementReason = isWaste
      ? MovementReason.WASTE
      : MovementReason.ADJUSTMENT;

    const notes =
      dto.note || dto.notes || (isWaste ? 'Waste' : 'Manual adjustment');
    const reference =
      dto.reference?.trim() || (isWaste ? 'Waste' : 'Adjustment');

    // 5. Transaction: Check current stock, update BranchStock, and log StockMovement
    return await this.prisma.$transaction(async (tx) => {
      // Find or create branch stock record
      let branchStock = await tx.branchStock.findUnique({
        where: {
          branchId_ingredientId: {
            branchId: dto.branchId,
            ingredientId: dto.ingredientId,
          },
        },
      });

      if (!branchStock) {
        branchStock = await tx.branchStock.create({
          data: {
            tenantId: tenant.id,
            branchId: dto.branchId,
            ingredientId: dto.ingredientId,
            currentStock: 0,
            reorderLevel: 0,
            unitCost: ingredient.costPerUnit,
          },
        });
      }

      const currentStock = branchStock.currentStock;
      const newStock = Math.round((currentStock + signedQty) * 1000) / 1000;

      // Prevent negative stock
      if (newStock < 0) {
        throw new BadRequestException(
          `Only ${currentStock} ${ingredient.unit} available in stock. Cannot remove ${qty} ${ingredient.unit}.`,
        );
      }

      // Update BranchStock
      await tx.branchStock.update({
        where: { id: branchStock.id },
        data: {
          currentStock: newStock,
          ...(signedQty > 0 && { lastRestockedAt: new Date() }),
        },
      });

      // Insert StockMovement
      await tx.stockMovement.create({
        data: {
          tenantId: tenant.id,
          branchId: dto.branchId,
          ingredientId: dto.ingredientId,
          quantity: signedQty,
          previousStock: currentStock,
          newStock: newStock,
          unit: ingredient.unit,
          reason: movementReason,
          reference,
          notes,
          createdBy: currentUser?.name || currentUser?.email || 'Staff',
        },
      });

      // Return updated ingredient with branch stock matching frontend expectations
      return {
        id: ingredient.id,
        tenantId: tenant.id,
        branchId: dto.branchId,
        name: ingredient.name,
        unit: ingredient.unit,
        stock: newStock,
        reorderLevel: branchStock.reorderLevel,
        unitCost: branchStock.unitCost,
      };
    });
  }

  /**
   * Get all stock movements for a tenant with optional branch, reason, and ingredient filters.
   */
  async getMovements(tenantSlug: string, query: GetMovementsQueryDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const where: Prisma.StockMovementWhereInput = {
      tenantId: tenant.id,
    };

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.ingredientId) {
      where.ingredientId = query.ingredientId;
    }

    if (query.reason && query.reason.toLowerCase() !== 'all') {
      const reasonUpper = query.reason.toUpperCase();
      if (Object.values(MovementReason).includes(reasonUpper as MovementReason)) {
        where.reason = reasonUpper as MovementReason;
      }
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const [total, movements] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Format for frontend Stock movements table:
    // head: ["Time", "Ingredient", "Reason", "Reference", "Change"]
    const formatted = movements.map((m) => ({
      id: m.id,
      tenantId: m.tenantId,
      branchId: m.branchId,
      branchName: m.branch?.name ?? '',
      ingredientId: m.ingredientId,
      ingredientName: m.ingredient?.name ?? 'Unknown',
      qty: m.quantity,
      unit: m.unit || m.ingredient?.unit || '',
      reason: m.reason.toLowerCase(),
      reference: m.reference || m.notes || '',
      previousStock: m.previousStock,
      newStock: m.newStock,
      createdBy: m.createdBy,
      createdAt: m.createdAt.toISOString(),
    }));

    return formatted;
  }
}
