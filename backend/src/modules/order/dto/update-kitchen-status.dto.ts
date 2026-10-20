import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { KitchenStatus } from '../../../../prisma/generated/client';

export class UpdateKitchenStatusDto {
  @ApiPropertyOptional({
    description: 'Specific kitchen status: NEW, PREPARING, READY, BUMPED',
    enum: KitchenStatus,
    example: KitchenStatus.PREPARING,
  })
  @IsEnum(KitchenStatus, {
    message: `kitchenStatus must be one of: ${Object.values(KitchenStatus).join(', ')}`,
  })
  @IsOptional()
  kitchenStatus?: KitchenStatus;
}
