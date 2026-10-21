import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetMenuItemsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter items by category ID',
    example: 'category-uuid',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Search items by name',
    example: 'Biryani',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter items by availability on POS',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({
    description:
      'Calculate effective prices and availability for a specific branch',
    example: 'branch-uuid-dinajpur',
  })
  @IsString()
  @IsOptional()
  branchId?: string;
}
