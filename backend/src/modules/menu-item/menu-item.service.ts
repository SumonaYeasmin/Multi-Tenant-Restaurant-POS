import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { GetMenuItemsQueryDto } from './dto/get-menu-items-query.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class MenuItemService {
  constructor(private readonly prisma: PrismaService) {}

  async createMenuItem(tenantSlug: string, dto: CreateMenuItemDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Verify category exists and belongs to this tenant
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        tenantId: tenant.id,
      },
    });

    if (!category) {
      throw new NotFoundException('Category');
    }

    const trimmedName = dto.name.trim();

    // 3. Check duplicate item name for this tenant (case-insensitive and not deleted)
    const existingItem = await this.prisma.menuItem.findFirst({
      where: {
        tenantId: tenant.id,
        isDeleted: false,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingItem) {
      throw new AlreadyExistsException('A menu item with this name');
    }

    // 4. Validate modifierGroupIds if provided
    if (dto.modifierGroupIds && dto.modifierGroupIds.length > 0) {
      const validGroupCount = await this.prisma.modifierGroup.count({
        where: {
          id: { in: dto.modifierGroupIds },
          tenantId: tenant.id,
          isDeleted: false,
        },
      });

      if (validGroupCount !== dto.modifierGroupIds.length) {
        throw new BadRequestException('One or more modifier groups are invalid');
      }
    }

    // 5. Validate branchIds in branchOverrides if provided
    if (dto.branchOverrides && dto.branchOverrides.length > 0) {
      const branchIds = dto.branchOverrides.map((b) => b.branchId);
      const validBranchCount = await this.prisma.branch.count({
        where: {
          id: { in: branchIds },
          tenantId: tenant.id,
        },
      });

      if (validBranchCount !== branchIds.length) {
        throw new BadRequestException('One or more branch IDs are invalid');
      }
    }

    // 6. Create menu item with nested variants and branch overrides
    const item = await this.prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: dto.categoryId,
        name: trimmedName,
        description: dto.description?.trim() ?? '',
        price: dto.price ?? 0.0,
        available: dto.available ?? true,
        tags: dto.tags ?? [],
        modifierGroupIds: dto.modifierGroupIds ?? [],
        variants:
          dto.variants && dto.variants.length > 0
            ? {
                create: dto.variants.map((v) => ({
                  name: v.name.trim(),
                  priceDelta: v.priceDelta ?? 0.0,
                })),
              }
            : undefined,
        branchOverrides:
          dto.branchOverrides && dto.branchOverrides.length > 0
            ? {
                create: dto.branchOverrides.map((b) => ({
                  branchId: b.branchId,
                  price: b.price ?? null,
                  isAvailable: b.isAvailable ?? true,
                })),
              }
            : undefined,
      },
      include: {
        category: true,
        variants: {
          orderBy: { createdAt: 'asc' },
        },
        branchOverrides: {
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

    return item;
  }

  async getAllMenuItems(tenantSlug: string, query?: GetMenuItemsQueryDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Build where filter
    const where: any = {
      tenantId: tenant.id,
      isDeleted: false,
    };

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query?.search) {
      where.name = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    if (query?.available !== undefined) {
      where.available = query.available;
    }

    // 3. Fetch items with relations
    const items = await this.prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        variants: {
          orderBy: { createdAt: 'asc' },
        },
        branchOverrides: {
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
      orderBy: { createdAt: 'asc' },
    });

    // 4. If branchId query is provided, compute effective price & availability
    if (query?.branchId) {
      return items.map((item) => {
        const branchOverride = item.branchOverrides.find(
          (b) => b.branchId === query.branchId,
        );

        return {
          ...item,
          effectivePrice: branchOverride?.price ?? item.price,
          effectiveAvailable: branchOverride?.isAvailable ?? item.available,
          branchOverride: branchOverride ?? null,
        };
      });
    }

    return items;
  }

  async getMenuItemById(
    tenantSlug: string,
    itemId: string,
    branchId?: string,
  ) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Fetch specific item
    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        tenantId: tenant.id,
        isDeleted: false,
      },
      include: {
        category: true,
        variants: {
          orderBy: { createdAt: 'asc' },
        },
        branchOverrides: {
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

    if (!item) {
      throw new NotFoundException('Menu item');
    }

    if (branchId) {
      const branchOverride = item.branchOverrides.find(
        (b) => b.branchId === branchId,
      );

      return {
        ...item,
        effectivePrice: branchOverride?.price ?? item.price,
        effectiveAvailable: branchOverride?.isAvailable ?? item.available,
        branchOverride: branchOverride ?? null,
      };
    }

    return item;
  }
}
