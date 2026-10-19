import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMovementsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter movements by branch ID',
    example: 'branch-uuid-mission',
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    description:
      'Filter movements by reason (all, sale, purchase, adjustment, waste, count, return)',
    example: 'waste',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Filter movements for a specific ingredient ID',
    example: 'ingredient-uuid-chicken',
  })
  @IsString()
  @IsOptional()
  ingredientId?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
