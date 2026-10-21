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
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateComboItemDto } from './create-combo-item.dto';

export class CreateComboDto {
  @ApiProperty({
    description: 'Name of the combo meal',
    example: 'Biryani Feast',
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty({ message: 'Combo name is required' })
  @MaxLength(60, { message: 'Combo name cannot exceed 60 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the combo meal',
    example: 'Kacchi biryani with masala chai',
    maxLength: 160,
  })
  @IsString()
  @MaxLength(160, { message: 'Description cannot exceed 160 characters' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Combo package price',
    example: 720.0,
    default: 0,
  })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiPropertyOptional({
    description: 'Whether the combo is available and visible on POS',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'available must be a boolean' })
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({
    description: 'Included items in this combo',
    type: [CreateComboItemDto],
  })
  @IsArray({ message: 'items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateComboItemDto)
  @IsOptional()
  items?: CreateComboItemDto[];

  @ApiPropertyOptional({
    description: 'Included components in this combo (matches frontend field name)',
    type: [CreateComboItemDto],
  })
  @IsArray({ message: 'components must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateComboItemDto)
  @IsOptional()
  components?: CreateComboItemDto[];
}
