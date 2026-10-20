import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import {
  CreateReservationDto,
  GetReservationsQueryDto,
  UpdateReservationSettingsDto,
} from './dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Reservations')
@Controller('tenants')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post(':tenantSlug/reservations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.RESERVATIONS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new table reservation',
    description:
      'Creates a new booking for guests with automated seating capacity verification and time conflict detection.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or capacity exceeded',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Restaurant, branch or table not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Table is already booked during the requested time window',
  })
  async createReservation(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateReservationDto,
  ) {
    const reservation = await this.reservationService.createReservation(
      tenantSlug,
      dto,
    );
    return ResponseHelper.created(
      reservation,
      'Reservation created successfully',
    );
  }

  @Get(':tenantSlug/reservations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.RESERVATIONS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all reservations of the restaurant',
    description:
      'Retrieves all reservations with optional filters for branch, status, table, search query, and date range.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservations retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getReservations(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetReservationsQueryDto,
  ) {
    const reservations = await this.reservationService.getReservations(
      tenantSlug,
      query,
    );
    return ResponseHelper.success(
      reservations,
      'Reservations retrieved successfully',
    );
  }

  @Get(':tenantSlug/reservations/:reservationId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.RESERVATIONS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific reservation',
    description: 'Retrieves a single reservation by its ID.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'reservationId',
    example: 'uuid',
    description: 'Reservation ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation or restaurant not found',
  })
  async getReservationById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('reservationId') reservationId: string,
  ) {
    const reservation = await this.reservationService.getReservationById(
      tenantSlug,
      reservationId,
    );
    return ResponseHelper.success(
      reservation,
      'Reservation retrieved successfully',
    );
  }

  @Get(':tenantSlug/reservation-settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.RESERVATIONS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get reservation policy settings',
    description:
      'Retrieves the current table reservation rules (dining duration, buffer time, early check-in, no-show grace period) for the restaurant.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation settings retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getReservationSettings(@Param('tenantSlug') tenantSlug: string) {
    const settings =
      await this.reservationService.getReservationSettings(tenantSlug);
    return ResponseHelper.success(
      settings,
      'Reservation settings retrieved successfully',
    );
  }

  @Put(':tenantSlug/reservation-settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update reservation policy settings',
    description:
      'Updates table reservation policies and rules. Accessible only by restaurant Owners and Managers.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation settings updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Insufficient permissions (Requires Owner or Manager)',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async updateReservationSettings(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: UpdateReservationSettingsDto,
  ) {
    const settings = await this.reservationService.updateReservationSettings(
      tenantSlug,
      dto,
    );
    return ResponseHelper.success(
      settings,
      'Reservation settings updated successfully',
    );
  }
}
