import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIngredientDto {
  @ApiProperty({
    description: 'Name of the ingredient / raw material',
    example: 'Chicken Breast',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Ingredient name is required' })
  @MaxLength(50, { message: 'Ingredient name cannot exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Unit of measurement (e.g. kg, liter, pcs, gram)',
    example: 'kg',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty({ message: 'Unit is required' })
  @MaxLength(20, { message: 'Unit cannot exceed 20 characters' })
  unit: string;

  @ApiPropertyOptional({
    description: 'Cost per unit in tenant currency',
    example: 4.5,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Unit cost must be a valid number' })
  @Min(0, { message: 'Unit cost cannot be negative' })
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({
    description: 'Unit cost (alias for costPerUnit to support frontend form payload)',
    example: 4.5,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Unit cost must be a valid number' })
  @Min(0, { message: 'Unit cost cannot be negative' })
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({
    description: 'Branch ID for branch stock and opening stock initialization',
    example: 'branch-uuid-mission',
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Initial opening stock quantity for the branch',
    example: 50,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Opening stock must be a valid number' })
  @Min(0, { message: 'Opening stock cannot be negative' })
  @IsOptional()
  openingStock?: number;

  @ApiPropertyOptional({
    description: 'Threshold quantity to trigger low stock alert',
    example: 10,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Reorder level must be a valid number' })
  @Min(0, { message: 'Reorder level cannot be negative' })
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional({
    description: 'Target / ideal stock level for the branch',
    example: 100,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Ideal stock must be a valid number' })
  @Min(0, { message: 'Ideal stock cannot be negative' })
  @IsOptional()
  idealStock?: number;

  @ApiPropertyOptional({
    description: 'Optional item SKU or barcode',
    example: 'ING-CHK-01',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Code cannot exceed 50 characters' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Optional category for grouping raw materials (e.g. Meat, Dairy, Vegetables)',
    example: 'Meat',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Category cannot exceed 50 characters' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Storage condition / location (e.g. Dry, Cold, Freezer)',
    example: 'Freezer',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Storage type cannot exceed 50 characters' })
  storageType?: string;
}
