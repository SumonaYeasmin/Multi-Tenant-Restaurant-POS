import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderModifierDto {
  @ApiPropertyOptional({
    description: 'ID of the modifier group (e.g. Cheese, Sauce, Size)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({
    description: 'ID of the modifier option selected',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsString()
  @IsOptional()
  optionId?: string;

  @ApiProperty({
    description: 'Name of the modifier/topping (e.g. Extra Cheese)',
    example: 'Extra Cheese',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Modifier name is required' })
  @MaxLength(100, { message: 'Modifier name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Additional price for this modifier',
    example: 50.0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Modifier price must be a valid number' })
  @Min(0, { message: 'Modifier price cannot be negative' })
  price: number;
}
