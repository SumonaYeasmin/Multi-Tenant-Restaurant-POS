import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { TableStatus } from '../../../prisma/generated/client';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class TableService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new dining table for a restaurant branch
   */
  async createTable(tenantSlug: string, dto: CreateTableDto) {
    // 1. Verify tenant exists by slug
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Verify that branch exists and belongs to this tenant
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: dto.branchId,
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch');
    }

    const trimmedName = dto.name.trim();

    // 3. Check if table name already exists in this branch (case-insensitive)
    const existingTable = await this.prisma.diningTable.findFirst({
      where: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
        isDeleted: false,
      },
    });

    if (existingTable) {
      throw new AlreadyExistsException(`Table with name "${trimmedName}"`);
    }

    // 4. Create the dining table in the database
    const table = await this.prisma.diningTable.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: trimmedName,
        seats: dto.seats ?? 4,
        area: dto.area?.trim() || 'Main hall',
        shape: dto.shape || 'square',
        status: dto.status || TableStatus.AVAILABLE,
        x: dto.x ?? 0,
        y: dto.y ?? 0,
        isActive: true,
      },
    });

    return table;
  }
}
