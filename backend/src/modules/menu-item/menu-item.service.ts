import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
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
}
