import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComboItemDto {
  @ApiProperty({
    description: 'Menu item ID to include in the combo',
    example: 'c1f7b02e-9d22-4411-9a77-338290333333',
  })
  @IsString()
  @IsNotEmpty({ message: 'itemId is required' })
  itemId: string;

  @ApiPropertyOptional({
    description: 'Quantity of this item in the combo',
    example: 1,
    default: 1,
  })
  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Quantity alias (for frontend qty property)',
    example: 1,
  })
  @IsInt({ message: 'qty must be an integer' })
  @Min(1, { message: 'qty must be at least 1' })
  @IsOptional()
  qty?: number;
}
