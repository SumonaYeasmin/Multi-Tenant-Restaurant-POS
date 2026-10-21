import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateReservationSettingsDto {
  @ApiPropertyOptional({
    description: 'Default dining duration for a table reservation in minutes',
    example: 90,
    default: 90,
    minimum: 15,
    maximum: 480,
  })
  @IsInt()
  @Min(15)
  @Max(480)
  @IsOptional()
  @Type(() => Number)
  defaultDurationMin?: number;

  @ApiPropertyOptional({
    description: 'Buffer time required before a booking in minutes',
    example: 30,
    default: 30,
    minimum: 0,
    maximum: 240,
  })
  @IsInt()
  @Min(0)
  @Max(240)
  @IsOptional()
  @Type(() => Number)
  bufferTimeMin?: number;

  @ApiPropertyOptional({
    description:
      'Early arrival window before booking time when guests can be seated (minutes)',
    example: 15,
    default: 15,
    minimum: 0,
    maximum: 120,
  })
  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  @Type(() => Number)
  earlyArrivalWindowMin?: number;

  @ApiPropertyOptional({
    description:
      'Grace period after booking time before marking as no-show (minutes)',
    example: 15,
    default: 15,
    minimum: 5,
    maximum: 120,
  })
  @IsInt()
  @Min(5)
  @Max(120)
  @IsOptional()
  @Type(() => Number)
  noShowGracePeriodMin?: number;

  @ApiPropertyOptional({
    description: 'Minimum party size allowed for a reservation',
    example: 1,
    default: 1,
    minimum: 1,
    maximum: 20,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  @Type(() => Number)
  minPartySize?: number;

  @ApiPropertyOptional({
    description:
      'Maximum party size allowed for an online/standard reservation',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  maxPartySize?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of days in advance guests can book',
    example: 30,
    default: 30,
    minimum: 1,
    maximum: 365,
  })
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  @Type(() => Number)
  maxAdvanceDays?: number;

  @ApiPropertyOptional({
    description: 'Minimum advance hours required before booking dining time',
    example: 2,
    default: 2,
    minimum: 0,
    maximum: 72,
  })
  @IsInt()
  @Min(0)
  @Max(72)
  @IsOptional()
  @Type(() => Number)
  minAdvanceHours?: number;
}
