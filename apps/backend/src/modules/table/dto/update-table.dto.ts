import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTableDto } from './create-table.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTableDto extends PartialType(CreateTableDto) {
  @ApiPropertyOptional({
    description: 'Whether the table is active and available on the floor plan',
    example: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}

export { UpdateTableDto as UpdateDiningTableDto };
