import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TableStatus } from '../../../../prisma/generated/client';

export class UpdateTableStatusDto {
  @ApiProperty({
    description: 'New operational status for the dining table',
    enum: TableStatus,
    example: TableStatus.OCCUPIED,
  })
  @IsEnum(TableStatus, {
    message: `Status must be one of: ${Object.values(TableStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Table status is required' })
  status: TableStatus;
}
