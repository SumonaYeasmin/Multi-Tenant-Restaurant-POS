import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateModifierOptionDto } from './create-modifier-option.dto';

export { CreateModifierOptionDto };

export class CreateModifierGroupDto {
  @ApiProperty({
    description: 'Name of the modifier group',
    example: 'Spice Level',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Group name is required' })
  @MaxLength(50, { message: 'Group name cannot exceed 50 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Minimum selections required (0 = optional, 1+ = required)',
    example: 0,
    default: 0,
  })
  @IsInt({ message: 'min must be an integer' })
  @Min(0, { message: 'min cannot be negative' })
  @IsOptional()
  min?: number;

  @ApiPropertyOptional({
    description: 'Maximum selections allowed',
    example: 1,
    default: 1,
  })
  @IsInt({ message: 'max must be an integer' })
  @Min(1, { message: 'max must be at least 1' })
  @IsOptional()
  max?: number;

  @ApiPropertyOptional({
    description: 'Initial options for this modifier group',
    type: [CreateModifierOptionDto],
  })
  @IsArray({ message: 'options must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateModifierOptionDto)
  @IsOptional()
  options?: CreateModifierOptionDto[];
}
