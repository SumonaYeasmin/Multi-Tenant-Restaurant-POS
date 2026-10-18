import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModifierOptionDto {
  @ApiPropertyOptional({
    description: 'Option ID (when updating or referencing existing options)',
    example: 'uuid',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Name of the modifier option',
    example: 'Extra Cheese',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Option name is required' })
  @MaxLength(50, { message: 'Option name cannot exceed 50 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Additional price for this option',
    example: 1.5,
    default: 0,
  })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price cannot be negative' })
  @IsOptional()
  price?: number;
}
