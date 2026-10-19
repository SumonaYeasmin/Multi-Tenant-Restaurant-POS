import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Branch ID where the stock is being adjusted',
    example: 'branch-uuid-mission',
  })
  @IsString()
  @IsNotEmpty({ message: 'branchId is required' })
  branchId: string;

  @ApiProperty({
    description: 'Ingredient ID whose stock is being adjusted',
    example: 'ingredient-uuid-chicken',
  })
  @IsString()
  @IsNotEmpty({ message: 'ingredientId is required' })
  ingredientId: string;

  @ApiProperty({
    description: 'Quantity to adjust (must be greater than zero)',
    example: 5,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @Min(0.0001, { message: 'Quantity must be greater than zero' })
  @IsOptional()
  qty?: number;

  @ApiPropertyOptional({
    description: 'Alias for qty matching standard naming',
    example: 5,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @Min(0.0001, { message: 'Quantity must be greater than zero' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description:
      'Direction of stock adjustment: "add" to increase stock, "remove" to decrease stock',
    enum: ['add', 'remove'],
    example: 'remove',
    default: 'add',
  })
  @IsIn(['add', 'remove'], {
    message: 'direction must be either "add" or "remove"',
  })
  @IsOptional()
  direction?: 'add' | 'remove';

  @ApiPropertyOptional({
    description:
      'Adjustment reason / category ("adjustment" or "waste" from UI, or standard enum reason)',
    example: 'waste',
    default: 'adjustment',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Note or reason explanation (e.g. "Spoiled in freezer", "Found extra bag")',
    example: 'Spoiled in freezer',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Note cannot exceed 255 characters' })
  note?: string;

  @ApiPropertyOptional({
    description: 'Alias for note field',
    example: 'Spoiled in freezer',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Notes cannot exceed 255 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Optional reference code, batch ID or ticket number',
    example: 'ADJ-2026-001',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Reference cannot exceed 100 characters' })
  reference?: string;
}
