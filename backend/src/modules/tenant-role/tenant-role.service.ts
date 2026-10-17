import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_ROLE_PERMISSIONS } from '../../common/constants/permissions.constant';
import { UserRole } from '../../../prisma/generated/client';
import { NotFoundException } from '../../common/exceptions/business.exception';

@Injectable()
export class TenantRoleService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantRoles(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        roles: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // If no roles exist yet for this tenant in DB, auto-populate with sensible defaults
    if (!tenant.roles || tenant.roles.length === 0) {
      const rolesToCreate = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(
        ([role, permissions]) => ({
          tenantId: tenant.id,
          role: role as UserRole,
          permissions: permissions as string[],
        }),
      );

      await this.prisma.tenantRole.createMany({
        data: rolesToCreate,
      });

      return this.prisma.tenantRole.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          role: true,
          permissions: true,
          updatedAt: true,
        },
        orderBy: { role: 'asc' },
      });
    }

    return tenant.roles.map((r) => ({
      id: r.id,
      role: r.role,
      permissions: r.permissions,
      updatedAt: r.updatedAt,
    }));
  }
}
