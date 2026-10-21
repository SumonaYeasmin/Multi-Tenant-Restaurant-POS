import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ReservationStatus } from '../../../../prisma/generated/client';

export class UpdateReservationStatusDto {
  @ApiProperty({
    description: 'New reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.SEATED,
  })
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;

  @ApiPropertyOptional({
    description: 'Optional: Assign or change table ID when seating the guest',
    example: '93f9e2e6-a2a2-4a57-b08e-173693e50772',
  })
  @IsUUID()
  @IsOptional()
  tableId?: string;
}
