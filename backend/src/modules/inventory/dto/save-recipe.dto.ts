import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeLineItemDto {
  @ApiProperty({
    description: 'Ingredient ID (UUID) from the ingredients inventory',
    example: 'uuid-chicken-breast',
  })
  @IsString()
  @IsOptional()
  ingredientId?: string;

  @ApiPropertyOptional({
    description: 'Alias for ingredientId matching frontend form payload',
    example: 'uuid-chicken-breast',
  })
  @IsString()
  @IsOptional()
  ingredientKey?: string;

  @ApiProperty({
    description: 'Quantity of ingredient used per single portion',
    example: 0.25,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @Min(0.0001, { message: 'Quantity must be greater than zero' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Alias for quantity matching frontend qty field',
    example: 0.25,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'qty must be a valid number' })
  @Min(0.0001, { message: 'qty must be greater than zero' })
  @IsOptional()
  qty?: number;

  @ApiPropertyOptional({
    description: 'Unit of measurement (e.g. kg, liter, pcs, gram)',
    example: 'kg',
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Optional variant ID if this line applies only to a specific item variant (e.g. Large / Half)',
    example: 'uuid-variant',
  })
  @IsString()
  @IsOptional()
  variantId?: string;
}

export class SaveRecipeDto {
  @ApiPropertyOptional({
    description: 'List of ingredients with portion quantities for this menu item',
    type: [RecipeLineItemDto],
  })
  @IsArray({ message: 'lines must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RecipeLineItemDto)
  @IsOptional()
  lines?: RecipeLineItemDto[];

  @ApiPropertyOptional({
    description: 'Alias for lines matching frontend payload (recipe: [...])',
    type: [RecipeLineItemDto],
  })
  @IsArray({ message: 'recipe must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RecipeLineItemDto)
  @IsOptional()
  recipe?: RecipeLineItemDto[];
}
