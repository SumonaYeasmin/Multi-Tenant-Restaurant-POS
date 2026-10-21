import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StockCountItemDto } from './stock-count-item.dto';

export class SubmitStockCountDto {
  @ApiProperty({
    description: 'Branch ID where physical stock count is performed',
    example: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsString()
  @IsNotEmpty({ message: 'Branch ID is required' })
  branchId: string;

  @ApiPropertyOptional({
    description: 'Auditor notes or remarks regarding discrepancy',
    example: 'Monthly routine stock audit. Shortage in cheese due to spillage.',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Name of the user performing the count (optional, can be taken from auth token)',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({
    description: 'List of ingredients with physical count',
    type: [StockCountItemDto],
  })
  @IsArray({ message: 'Counts must be an array of items' })
  @ArrayMinSize(1, { message: 'At least one ingredient must be counted' })
  @ValidateNested({ each: true })
  @Type(() => StockCountItemDto)
  counts: StockCountItemDto[];
}
