import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Beverages',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MaxLength(50, { message: 'Category name cannot exceed 50 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of the category',
    example: 'Hot & cold drinks and smoothies',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Description cannot exceed 255 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Sort order / display order on POS tabs',
    example: 0,
    default: 0,
  })
  @IsNumber({}, { message: 'Sort order must be a number' })
  @Min(0, { message: 'Sort order cannot be negative' })
  @IsOptional()
  sort?: number;
}
