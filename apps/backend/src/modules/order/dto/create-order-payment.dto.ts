import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../../../prisma/generated/client';

export class CreateOrderPaymentDto {
  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(PaymentMethod, {
    message: `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Amount paid',
    example: 450.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Payment amount must be a valid number' })
  @Min(0, { message: 'Payment amount cannot be negative' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Total money tendered by customer (e.g. 500 BDT cash note)',
    example: 500.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tendered amount must be a valid number' })
  @Min(0, { message: 'Tendered amount cannot be negative' })
  @IsOptional()
  tendered?: number;

  @ApiPropertyOptional({
    description: 'Change returned to customer (e.g. 50 BDT)',
    example: 50.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Change amount must be a valid number' })
  @Min(0, { message: 'Change cannot be negative' })
  @IsOptional()
  change?: number;

  @ApiPropertyOptional({
    description: 'Transaction reference (e.g. Card slip #, bKash TrxID)',
    example: 'TXN-9823412',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Reference cannot exceed 100 characters' })
  reference?: string;
}
