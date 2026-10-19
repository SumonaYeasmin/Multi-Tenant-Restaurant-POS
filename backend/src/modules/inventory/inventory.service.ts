import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { GetIngredientsQueryDto } from './dto/get-ingredients-query.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';
import { MovementReason, Prisma } from '../../../prisma/generated/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new ingredient for a tenant and initialize branch stock
   * across tenant branches (target branch gets opening stock, others get 0 stock).
   */
  async createIngredient(
    tenantSlug: string,
    dto: CreateIngredientDto,
    currentUser?: any,
  ) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const trimmedName = dto.name.trim();

    // 2. Check if ingredient with this name already exists for this tenant
    const existing = await this.prisma.ingredient.findFirst({
      where: {
        tenantId: tenant.id,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
        isDeleted: false,
      },
    });

    if (existing) {
      throw new AlreadyExistsException('An ingredient with this name');
    }

    // 3. Find tenant branches
    const branches = await this.prisma.branch.findMany({
      where: { tenantId: tenant.id, isActive: true },
    });

    // If branchId is explicitly passed, ensure it exists and belongs to this tenant
    if (dto.branchId) {
      const branchBelongsToTenant = branches.some((b) => b.id === dto.branchId);
      if (!branchBelongsToTenant) {
        const branchExists = await this.prisma.branch.findFirst({
          where: { id: dto.branchId, tenantId: tenant.id },
        });
        if (!branchExists) {
          throw new NotFoundException('Branch');
        }
      }
    }

    const unitCost = dto.costPerUnit ?? dto.unitCost ?? 0;
    const openingStock = dto.openingStock ?? 0;
    const reorderLevel = dto.reorderLevel ?? 0;
    const idealStock = dto.idealStock ?? 0;

    // 4. Create in Prisma transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Step A: Create master ingredient
      const ingredient = await tx.ingredient.create({
        data: {
          tenantId: tenant.id,
          name: trimmedName,
          code: dto.code?.trim() || '',
          category: dto.category?.trim() || '',
          storageType: dto.storageType?.trim() || '',
          unit: dto.unit.trim(),
          costPerUnit: unitCost,
          isActive: true,
          isDeleted: false,
        },
      });

      // Step B: Initialize BranchStock for each branch
      // (The target branch gets openingStock, other branches get 0 stock)
      for (const branch of branches) {
        const isTargetBranch = dto.branchId
          ? branch.id === dto.branchId
          : branches.length === 1;

        const initialStock = isTargetBranch ? openingStock : 0;

        await tx.branchStock.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            ingredientId: ingredient.id,
            currentStock: initialStock,
            reorderLevel: reorderLevel,
            idealStock: idealStock,
            unitCost: unitCost,
            lastRestockedAt: initialStock > 0 ? new Date() : null,
          },
        });

        // Step C: Log StockMovement audit trail if initial stock was provided
        if (isTargetBranch && initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              tenantId: tenant.id,
              branchId: branch.id,
              ingredientId: ingredient.id,
              quantity: initialStock,
              previousStock: 0,
              newStock: initialStock,
              unit: dto.unit.trim(),
              reason: MovementReason.ADJUSTMENT,
              reference: 'Opening stock',
              notes: 'Initial stock on creation',
              createdBy:
                currentUser?.name || currentUser?.email || 'System User',
            },
          });
        }
      }

      // Return created ingredient with populated branch stocks
      return tx.ingredient.findUnique({
        where: { id: ingredient.id },
        include: {
          branchStocks: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Get all ingredients for a tenant with optional branch stock calculation,
   * search, category filtering, and low stock filtering.
   */
  async getIngredients(tenantSlug: string, query: GetIngredientsQueryDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const where: Prisma.IngredientWhereInput = {
      tenantId: tenant.id,
      isDeleted: false,
    };

    if (query.activeOnly !== undefined) {
      where.isActive = query.activeOnly;
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.search?.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { code: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const branchId = query.branchId;

    if (branchId) {
      const ingredients = await this.prisma.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          branchStocks: {
            where: { branchId },
          },
        },
      });

      const formatted = ingredients.map((ing) => {
        const bStock = ing.branchStocks?.[0];
        const stock = bStock?.currentStock ?? 0;
        const reorderLevel = bStock?.reorderLevel ?? 0;
        const unitCost = bStock?.unitCost ?? ing.costPerUnit;

        return {
          id: ing.id,
          tenantId: ing.tenantId,
          branchId,
          name: ing.name,
          code: ing.code,
          category: ing.category,
          storageType: ing.storageType,
          unit: ing.unit,
          stock,
          reorderLevel,
          idealStock: bStock?.idealStock ?? 0,
          unitCost,
          isActive: ing.isActive,
          createdAt: ing.createdAt,
          updatedAt: ing.updatedAt,
        };
      });

      if (query.lowStockOnly) {
        return formatted.filter((item) => item.stock <= item.reorderLevel);
      }

      return formatted;
    }

    return await this.prisma.ingredient.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        branchStocks: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get a single ingredient by ID with branch stock details.
   */
  async getIngredientById(tenantSlug: string, ingredientId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const ingredient = await this.prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        tenantId: tenant.id,
        isDeleted: false,
      },
      include: {
        branchStocks: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient');
    }

    return ingredient;
  }
}
