import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateComboDto } from './dto/create-combo.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class ComboService {
  constructor(private readonly prisma: PrismaService) {}

  async createCombo(tenantSlug: string, dto: CreateComboDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const trimmedName = dto.name.trim();

    // 2. Check if a non-deleted combo with same name exists for this tenant
    const existing = await this.prisma.combo.findFirst({
      where: {
        tenantId: tenant.id,
        isDeleted: false,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new AlreadyExistsException('A combo with this name');
    }

    // 3. Process items / components array
    const rawItems = dto.items ?? dto.components ?? [];
    const itemMap = new Map<string, number>();

    for (const item of rawItems) {
      const itemId = item.itemId.trim();
      const qty = item.quantity ?? item.qty ?? 1;
      if (qty <= 0) {
        throw new BadRequestException('Item quantity must be at least 1');
      }
      itemMap.set(itemId, (itemMap.get(itemId) ?? 0) + qty);
    }

    const normalizedItems = Array.from(itemMap.entries()).map(
      ([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }),
    );

    // 4. Create combo with items
    const combo = await this.prisma.combo.create({
      data: {
        tenantId: tenant.id,
        name: trimmedName,
        description: dto.description?.trim() ?? '',
        price: dto.price ?? 0.0,
        available: dto.available ?? true,
        items:
          normalizedItems.length > 0
            ? {
                create: normalizedItems,
              }
            : undefined,
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      ...combo,
      components: combo.items.map((it) => ({
        itemId: it.menuItemId,
        qty: it.quantity,
      })),
    };
  }
}
