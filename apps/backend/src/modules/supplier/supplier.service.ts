import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import {
  NotFoundException,
  AlreadyExistsException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new supplier for a tenant
   */
  async createSupplier(tenantSlug: string, dto: CreateSupplierDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const trimmedName = dto.name.trim();

    // 2. Check if a non-deleted supplier with this name already exists for this tenant
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        tenantId: tenant.id,
        isDeleted: false,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingSupplier) {
      throw new AlreadyExistsException('A supplier with this name');
    }

    // 3. Create the supplier
    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: trimmedName,
        contact: dto.contact?.trim() || '',
        phone: dto.phone?.trim() || '',
        email: dto.email?.trim() || '',
        address: dto.address?.trim() || '',
        supplies: dto.supplies?.trim() || '',
        paymentTerms: dto.paymentTerms?.trim() || '',
        active: dto.active !== undefined ? dto.active : true,
      },
    });

    return supplier;
  }
}
