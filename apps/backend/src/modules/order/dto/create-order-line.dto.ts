import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderModifierDto } from './create-order-modifier.dto';

export class CreateOrderLineDto {
  @ApiPropertyOptional({
    description: 'Menu item ID in the database',
    example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  })
  @IsString()
  @IsOptional()
  menuItemId?: string;

  @ApiPropertyOptional({
    description: 'Alternative menu item ID (matches frontend POS cart itemId)',
    example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  })
  @IsString()
  @IsOptional()
  itemId?: string;

  @ApiProperty({
    description: 'Display name of the menu item',
    example: 'Beef Kacchi Biryani',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Item name is required' })
  @MaxLength(100, { message: 'Item name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Selected variant ID (e.g. Full, Half, Regular, Large)',
    example: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({
    description: 'Selected variant name',
    example: 'Full Plate',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Variant name cannot exceed 60 characters' })
  variantName?: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  qty: number = 1;

  @ApiProperty({
    description: 'Unit price of the item (base price + variant delta)',
    example: 380.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Unit price must be a valid number' })
  @Min(0, { message: 'Unit price cannot be negative' })
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Kitchen preparation note for this item (e.g. Less spicy, No onions)',
    example: 'Less spicy, no salad',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Notes cannot exceed 255 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'List of selected modifiers / toppings for this line item',
    type: [CreateOrderModifierDto],
  })
  @IsArray({ message: 'Modifiers must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderModifierDto)
  @IsOptional()
  modifiers?: CreateOrderModifierDto[] = [];
}
