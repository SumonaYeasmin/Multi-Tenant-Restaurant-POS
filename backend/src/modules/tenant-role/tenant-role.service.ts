import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_ROLE_PERMISSIONS } from '../../common/constants/permissions.constant';
import { UserRole } from '../../../prisma/generated/client';
import { NotFoundException } from '../../common/exceptions/business.exception';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

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

  async updateRolePermissions(
    tenantSlug: string,
    roleParam: string,
    dto: UpdateRolePermissionsDto,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const roleUpper = roleParam.toUpperCase() as UserRole;
    if (!Object.values(UserRole).includes(roleUpper)) {
      throw new BadRequestException(
        `Invalid role: "${roleParam}". Allowed roles are: ${Object.values(UserRole).join(', ')}`,
      );
    }

    // Upsert role permissions for this tenant
    const updated = await this.prisma.tenantRole.upsert({
      where: {
        tenantId_role: {
          tenantId: tenant.id,
          role: roleUpper,
        },
      },
      update: {
        permissions: dto.permissions,
      },
      create: {
        tenantId: tenant.id,
        role: roleUpper,
        permissions: dto.permissions,
      },
    });

    return {
      id: updated.id,
      role: updated.role,
      permissions: updated.permissions,
      updatedAt: updated.updatedAt,
    };
  }
}
