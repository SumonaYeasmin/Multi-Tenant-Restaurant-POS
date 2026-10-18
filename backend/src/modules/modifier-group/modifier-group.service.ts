import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class ModifierGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async createModifierGroup(tenantSlug: string, dto: CreateModifierGroupDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const trimmedName = dto.name.trim();

    // 2. Check if group with same name exists for this tenant (case-insensitive)
    const existingGroup = await this.prisma.modifierGroup.findFirst({
      where: {
        tenantId: tenant.id,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingGroup) {
      throw new AlreadyExistsException('A modifier group with this name');
    }

    // 3. Validate min/max constraints
    const min = dto.min ?? 0;
    const max = dto.max ?? 1;

    if (min > max) {
      throw new BadRequestException(
        'Minimum selections cannot exceed maximum selections',
      );
    }

    if (dto.options && dto.options.length > 0 && max > dto.options.length) {
      throw new BadRequestException(
        'Maximum selections cannot exceed the number of available options',
      );
    }

    const isRequired = min > 0;

    // 4. Create modifier group with options
    const group = await this.prisma.modifierGroup.create({
      data: {
        tenantId: tenant.id,
        name: trimmedName,
        min,
        max,
        isRequired,
        options:
          dto.options && dto.options.length > 0
            ? {
                create: dto.options.map((opt) => ({
                  name: opt.name.trim(),
                  price: opt.price ?? 0.0,
                })),
              }
            : undefined,
      },
      include: {
        options: true,
      },
    });

    return group;
  }
}
