import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableStatus } from '../../../../prisma/generated/client';

export class CreateTableDto {
  @ApiProperty({
    description: 'Branch ID where this table belongs',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'Branch ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Branch ID is required' })
  branchId: string;

  @ApiProperty({
    description: 'Table name or number (must be unique per branch)',
    example: 'T-1',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty({ message: 'Table name is required' })
  @MaxLength(30, { message: 'Table name cannot exceed 30 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Seating capacity of the table',
    example: 4,
    default: 4,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Seats must be an integer' })
  @Min(1, { message: 'Seats must be at least 1' })
  @Max(100, { message: 'Seats cannot exceed 100' })
  @IsOptional()
  seats?: number = 4;

  @ApiPropertyOptional({
    description: 'Floor section / area (e.g. Main hall, Terrace, VIP, Outdoor)',
    example: 'Main hall',
    default: 'Main hall',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Area cannot exceed 50 characters' })
  area?: string = 'Main hall';

  @ApiPropertyOptional({
    description: 'Physical shape of the table on the floor plan',
    example: 'square',
    enum: ['square', 'round', 'long'],
    default: 'square',
  })
  @IsString()
  @IsIn(['square', 'round', 'long'], {
    message: 'Shape must be either "square", "round", or "long"',
  })
  @IsOptional()
  shape?: 'square' | 'round' | 'long' = 'square';

  @ApiPropertyOptional({
    description: 'Initial status of the dining table',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  @IsEnum(TableStatus, {
    message: `Status must be one of: ${Object.values(TableStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TableStatus = TableStatus.AVAILABLE;

  @ApiPropertyOptional({
    description: 'X-coordinate position on the floor plan canvas',
    example: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'X position must be an integer' })
  @IsOptional()
  x?: number = 0;

  @ApiPropertyOptional({
    description: 'Y-coordinate position on the floor plan canvas',
    example: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsInt({ message: 'Y position must be an integer' })
  @IsOptional()
  y?: number = 0;
}

export { CreateTableDto as CreateDiningTableDto };
