import { PartialType } from '@nestjs/swagger';
import { CreateModifierGroupDto } from './create-modifier-group.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModifierGroupDto extends PartialType(CreateModifierGroupDto) {
  @ApiPropertyOptional({
    description:
      'Whether the modifier group is active and selectable on POS/menu',
    example: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}

