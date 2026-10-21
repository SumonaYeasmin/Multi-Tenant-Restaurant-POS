import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({
    description: 'Name of the branch',
    example: 'Dhanmondi Branch',
    maxLength: 60,
  })
  @IsString()
  @IsNotEmpty({ message: 'Branch name is required' })
  @MaxLength(60, { message: 'Branch name cannot exceed 60 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Physical address of the branch',
    example: 'House 12, Road 5, Dhanmondi, Dhaka',
    maxLength: 120,
  })
  @IsString()
  @IsOptional()
  @MaxLength(120, { message: 'Address cannot exceed 120 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number of the branch',
    example: '+8801700000000',
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'Phone number cannot exceed 30 characters' })
  phone?: string;
}
