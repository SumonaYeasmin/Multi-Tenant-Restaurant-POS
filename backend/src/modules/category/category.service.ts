import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(tenantSlug: string, dto: CreateCategoryDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const trimmedName = dto.name.trim();

    // 2. Check if category with this name already exists for this tenant (case-insensitive)
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        tenantId: tenant.id,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      throw new AlreadyExistsException('A category with this name');
    }

    // 3. Auto-calculate sort order if not provided (append to end of list)
    let sortOrder = dto.sort;
    if (sortOrder === undefined || sortOrder === null) {
      sortOrder = await this.prisma.category.count({
        where: { tenantId: tenant.id },
      });
    }

    // 4. Create category
    const category = await this.prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: trimmedName,
        description: dto.description?.trim() || '',
        sort: sortOrder,
        isActive: true,
      },
    });

    return category;
  }
}
