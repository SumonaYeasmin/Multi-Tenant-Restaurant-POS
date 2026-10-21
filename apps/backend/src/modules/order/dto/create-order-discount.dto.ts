import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDiscountDto {
  @ApiProperty({
    description: 'Discount calculation type ("percent" or "amount")',
    example: 'percent',
    enum: ['percent', 'amount'],
  })
  @IsString()
  @IsIn(['percent', 'amount'], {
    message: 'Discount kind must be either "percent" or "amount"',
  })
  @IsNotEmpty({ message: 'Discount kind is required' })
  kind: 'percent' | 'amount';

  @ApiProperty({
    description: 'Discount value (e.g. 10 for 10% or 50 for 50 BDT)',
    example: 10,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Discount value must be a valid number' })
  @Min(0, { message: 'Discount value cannot be negative' })
  value: number;

  @ApiPropertyOptional({
    description: 'Reason for granting the discount',
    example: 'Manager Special',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Reason cannot exceed 100 characters' })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Promotional coupon code if applied',
    example: 'SAVE10',
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'Promo code cannot exceed 30 characters' })
  promoCode?: string;
}
