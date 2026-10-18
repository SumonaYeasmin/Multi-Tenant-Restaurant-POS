import { PartialType } from '@nestjs/swagger';
import { CreateModifierOptionDto } from './create-modifier-option.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModifierOptionDto extends PartialType(
  CreateModifierOptionDto,
) {
  @ApiPropertyOptional({
    description:
      'Whether the modifier option is active and selectable on POS/menu',
    example: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
