import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UserRole } from '../../../prisma/generated/client';
import { NotFoundException } from '../../common/exceptions/business.exception';
import { DEFAULT_ROLE_PERMISSIONS } from '../../common/constants/permissions.constant';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async createStaff(tenantSlug: string, dto: CreateStaffDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Ensure TenantRole exists for this tenant
    let tenantRole = await this.prisma.tenantRole.findUnique({
      where: {
        tenantId_role: {
          tenantId: tenant.id,
          role: dto.role,
        },
      },
    });

    if (!tenantRole) {
      tenantRole = await this.prisma.tenantRole.create({
        data: {
          tenantId: tenant.id,
          role: dto.role,
          permissions: (DEFAULT_ROLE_PERMISSIONS[dto.role] || []).map(String),
        },
      });
    }

    // 3. Create staff member in database
    const staff = await this.prisma.staffMember.create({
      data: {
        tenantId: tenant.id,
        roleId: tenantRole.id,
        role: dto.role,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        hourlyRate: dto.hourlyRate ?? 0,
        branchIds: dto.branchIds ?? ['all'],
        active: dto.active ?? true,
      },
    });

    return staff;
  }

  async getStaffList(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    return this.prisma.staffMember.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStaffById(tenantSlug: string, staffId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const staff = await this.prisma.staffMember.findFirst({
      where: {
        id: staffId,
        tenantId: tenant.id,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member');
    }

    return staff;
  }

  async updateStaff(
    tenantSlug: string,
    staffId: string,
    dto: UpdateStaffDto,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const existingStaff = await this.prisma.staffMember.findFirst({
      where: {
        id: staffId,
        tenantId: tenant.id,
      },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member');
    }

    let roleId = existingStaff.roleId;

    // If role is being changed, ensure new TenantRole is referenced
    if (dto.role && dto.role !== existingStaff.role) {
      let newRole = await this.prisma.tenantRole.findUnique({
        where: {
          tenantId_role: {
            tenantId: tenant.id,
            role: dto.role,
          },
        },
      });

      if (!newRole) {
        newRole = await this.prisma.tenantRole.create({
          data: {
            tenantId: tenant.id,
            role: dto.role,
            permissions: (DEFAULT_ROLE_PERMISSIONS[dto.role] || []).map(String),
          },
        });
      }
      roleId = newRole.id;
    }

    const updated = await this.prisma.staffMember.update({
      where: { id: staffId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.role !== undefined && { role: dto.role, roleId }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.branchIds !== undefined && { branchIds: dto.branchIds }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });

    return updated;
  }

  async deleteStaff(tenantSlug: string, staffId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const existingStaff = await this.prisma.staffMember.findFirst({
      where: {
        id: staffId,
        tenantId: tenant.id,
      },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff member');
    }

    await this.prisma.staffMember.delete({
      where: { id: staffId },
    });

    return { id: staffId };
  }
}
