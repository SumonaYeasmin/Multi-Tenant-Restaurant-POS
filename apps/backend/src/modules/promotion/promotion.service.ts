import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { DiscountKind } from '../../../prisma/generated/client';

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve tenant entity by either slug or id
   */
  private async resolveTenant(tenantSlugOrId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ slug: tenantSlugOrId }, { id: tenantSlugOrId }],
      },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Restaurant tenant "${tenantSlugOrId}" not found`,
      );
    }
    return tenant;
  }

  /**
   * Create a new promotion for a restaurant tenant
   */
  async createPromotion(tenantSlug: string, dto: CreatePromotionDto) {
    const tenant = await this.resolveTenant(tenantSlug);

    const code = dto.code.trim().toUpperCase();

    // 1. Validate Code regex
    if (!/^[A-Z0-9]{3,16}$/.test(code)) {
      throw new BadRequestException(
        'Code must be 3–16 letters or digits (alphanumeric).',
      );
    }

    // 2. Validate Discount Value & Cap
    if (dto.value <= 0) {
      throw new BadRequestException(
        'Enter a valid discount value greater than 0.',
      );
    }

    if (dto.kind === DiscountKind.PERCENT && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%.');
    }

    // 3. Validate Date Range
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
    const endsAt = new Date(dto.endsAt);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid date format provided.');
    }

    if (endsAt < startsAt) {
      throw new BadRequestException(
        'End date must be on or after the start date.',
      );
    }

    // 4. Check for duplicate code within active promotions of this tenant
    const existing = await this.prisma.promotion.findFirst({
      where: {
        tenantId: tenant.id,
        code,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A promotion with code "${code}" already exists for this restaurant.`,
      );
    }

    // 5. Create promotion record
    return this.prisma.promotion.create({
      data: {
        tenantId: tenant.id,
        name: dto.name.trim(),
        code,
        kind: dto.kind,
        value: dto.value,
        minSpend: dto.minSpend ?? 0,
        startsAt,
        endsAt,
        maxUses: dto.maxUses ?? null,
        active: dto.active ?? true,
        uses: 0,
      },
    });
  }

  /**
   * Get all active promotions for a restaurant tenant
   */
  async getPromotions(tenantSlug: string) {
    const tenant = await this.resolveTenant(tenantSlug);

    return this.prisma.promotion.findMany({
      where: {
        tenantId: tenant.id,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get promotion by ID
   */
  async getPromotionById(tenantSlug: string, id: string) {
    const tenant = await this.resolveTenant(tenantSlug);

    const promotion = await this.prisma.promotion.findFirst({
      where: {
        id,
        tenantId: tenant.id,
        isDeleted: false,
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found.');
    }

    return promotion;
  }
}
