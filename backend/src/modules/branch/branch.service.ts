import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async createBranch(tenantSlug: string, dto: CreateBranchDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const trimmedName = dto.name.trim();

    // 2. Check if branch with this name already exists for this tenant (case-insensitive)
    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        tenantId: tenant.id,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingBranch) {
      throw new AlreadyExistsException('A branch with this name');
    }

    // 3. Create branch
    const branch = await this.prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: trimmedName,
        address: dto.address?.trim() || '',
        phone: dto.phone?.trim() || '',
        isActive: true,
      },
    });

    return branch;
  }

  async getAllBranches(tenantSlug: string) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Fetch all branches for this tenant
    return this.prisma.branch.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'asc' },
    });
  }
}
