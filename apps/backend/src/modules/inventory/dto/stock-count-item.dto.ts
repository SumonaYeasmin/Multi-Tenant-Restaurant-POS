import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StockCountItemDto {
  @ApiProperty({
    description: 'Ingredient ID',
    example: 'd3b07384-d113-4c97-9e4a-47d34199c011',
  })
  @IsString()
  @IsNotEmpty({ message: 'Ingredient ID is required' })
  ingredientId: string;

  @ApiProperty({
    description: 'Physically counted quantity (can be decimal, e.g. 2.450 kg)',
    example: 35.5,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Counted quantity must be a valid number' })
  @Min(0, { message: 'Counted quantity cannot be negative' })
  counted: number;
}
