import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemVariantDto {
  @ApiPropertyOptional({
    description: 'Variant ID (when updating existing variants)',
    example: 'uuid',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Variant name (e.g. Full, Half, Small, Large)',
    example: 'Half',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Variant name is required' })
  @MaxLength(50, { message: 'Variant name cannot exceed 50 characters' })
  name: string;

  @ApiProperty({
    description:
      'Price delta relative to base price (e.g. -100 for Half, +80 for Large)',
    example: -100,
    default: 0,
  })
  @IsNumber({}, { message: 'priceDelta must be a number' })
  priceDelta: number;
}

export class CreateBranchOverrideDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-uuid-dinajpur',
  })
  @IsString()
  @IsNotEmpty({ message: 'branchId is required' })
  branchId: string;

  @ApiPropertyOptional({
    description: 'Custom price for this branch (leave blank to use base price)',
    example: 380.0,
  })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price cannot be negative' })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Whether the item is available in this branch',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'isAvailable must be a boolean' })
  @IsOptional()
  isAvailable?: boolean;
}

export class CreateMenuItemDto {
  @ApiProperty({
    description: 'Name of the menu item',
    example: 'Kacchi Biryani',
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty({ message: 'Item name is required' })
  @MaxLength(60, { message: 'Item name cannot exceed 60 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the item',
    example: 'Traditional mutton kacchi cooked with aromatic basmati rice',
    maxLength: 160,
  })
  @IsString()
  @MaxLength(160, { message: 'Description cannot exceed 160 characters' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Category ID this item belongs to',
    example: 'category-uuid-biryani',
  })
  @IsString()
  @IsNotEmpty({ message: 'categoryId is required' })
  categoryId: string;

  @ApiProperty({
    description: 'Central base price',
    example: 450.0,
    default: 0,
  })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiPropertyOptional({
    description: 'Global availability on POS',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'available must be a boolean' })
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for searching and filtering',
    example: ['spicy', 'popular'],
    type: [String],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  })
  @IsArray({ message: 'tags must be an array of strings' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Modifier Group IDs attached to this item',
    example: ['modifier-group-uuid-spice-level'],
    type: [String],
  })
  @IsArray({ message: 'modifierGroupIds must be an array of strings' })
  @IsString({ each: true, message: 'Each modifierGroupId must be a string' })
  @IsOptional()
  modifierGroupIds?: string[];

  @ApiPropertyOptional({
    description: 'Sizes/portions for this item',
    type: [CreateMenuItemVariantDto],
  })
  @IsArray({ message: 'variants must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemVariantDto)
  @IsOptional()
  variants?: CreateMenuItemVariantDto[];

  @ApiPropertyOptional({
    description: 'Branch-specific price and availability overrides',
    type: [CreateBranchOverrideDto],
  })
  @IsArray({ message: 'branchOverrides must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateBranchOverrideDto)
  @IsOptional()
  branchOverrides?: CreateBranchOverrideDto[];
}
