import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto, GetReservationsQueryDto } from './dto';
import { Prisma, ReservationStatus } from '../../../prisma/generated/client';
import {
  NotFoundException,
  ConflictException,
} from '../../common/exceptions/business.exception';

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new table reservation with seating capacity and time clash detection
   */
  async createReservation(tenantSlug: string, dto: CreateReservationDto) {
    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    // 2. Verify branch exists, is active, and belongs to tenant
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

    // 3. Validate customer name
    const customerName = dto.customerName?.trim();
    if (!customerName) {
      throw new BadRequestException('Guest name is required.');
    }

    // 4. Validate reservation date & time
    const bookingDate = new Date(dto.at);
    if (isNaN(bookingDate.getTime())) {
      throw new BadRequestException(
        'Valid reservation date and time is required.',
      );
    }

    const partySize = dto.partySize ?? 2;
    const durationMin = dto.durationMin ?? 90;

    let assignedTable: { id: string; name: string; seats: number } | null =
      null;

    // 5. If tableId is specified, validate table, capacity, and check collision
    const normalizedTableId =
      dto.tableId && dto.tableId !== 'none' ? dto.tableId : null;

    if (normalizedTableId) {
      const table = await this.prisma.diningTable.findFirst({
        where: {
          id: normalizedTableId,
          branchId: branch.id,
          tenantId: tenant.id,
          isDeleted: false,
        },
      });

      if (!table) {
        throw new NotFoundException('Dining table in this branch');
      }

      // Check capacity
      if (table.seats < partySize) {
        throw new BadRequestException(
          `${table.name} seats only ${table.seats}.`,
        );
      }

      // Check for time collisions against active reservations (BOOKED or SEATED)
      const reqStart = bookingDate.getTime();
      const reqEnd = reqStart + durationMin * 60000;

      // Query active bookings for this table around the window (lookback 8h, lookahead to reqEnd)
      const maxLookbackMs = 8 * 60 * 60 * 1000;
      const candidates = await this.prisma.reservation.findMany({
        where: {
          tenantId: tenant.id,
          tableId: table.id,
          status: {
            in: [ReservationStatus.BOOKED, ReservationStatus.SEATED],
          },
          at: {
            gte: new Date(reqStart - maxLookbackMs),
            lte: new Date(reqEnd),
          },
        },
      });

      for (const existing of candidates) {
        const existStart = existing.at.getTime();
        const existEnd = existStart + existing.durationMin * 60000;

        // Collision formula: reqStart < existEnd && existStart < reqEnd
        if (reqStart < existEnd && existStart < reqEnd) {
          throw new ConflictException(
            `${table.name} is already booked for ${existing.customerName} at that time.`,
          );
        }
      }

      assignedTable = table;
    }

    // 6. Save reservation to database
    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        customerName,
        phone: dto.phone?.trim() ?? '',
        partySize,
        at: bookingDate,
        durationMin,
        tableId: assignedTable ? assignedTable.id : null,
        tableName: assignedTable ? assignedTable.name : null,
        status: ReservationStatus.BOOKED,
        notes: dto.notes?.trim() ?? '',
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            seats: true,
            area: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return reservation;
  }

  /**
   * Get all reservations for a restaurant with branch, status, table, and date filtering
   */
  async getReservations(tenantSlug: string, query: GetReservationsQueryDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const where: Prisma.ReservationWhereInput = {
      tenantId: tenant.id,
    };

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.tableId) {
      where.tableId = query.tableId;
    }

    if (query.status) {
      const statusLower = query.status.toLowerCase();
      if (statusLower === 'active') {
        where.status = {
          in: [ReservationStatus.BOOKED, ReservationStatus.SEATED],
        };
      } else {
        const enumKey = query.status.toUpperCase() as ReservationStatus;
        if (Object.values(ReservationStatus).includes(enumKey)) {
          where.status = enumKey;
        }
      }
    }

    if (query.startDate || query.endDate) {
      where.at = {};
      if (query.startDate) {
        where.at.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.at.lte = new Date(query.endDate);
      }
    }

    if (query.search?.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    return this.prisma.reservation.findMany({
      where,
      orderBy: {
        at: 'asc',
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            seats: true,
            area: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get details of a single reservation
   */
  async getReservationById(tenantSlug: string, reservationId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurant');
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        tenantId: tenant.id,
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            seats: true,
            area: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation');
    }

    return reservation;
  }
}
