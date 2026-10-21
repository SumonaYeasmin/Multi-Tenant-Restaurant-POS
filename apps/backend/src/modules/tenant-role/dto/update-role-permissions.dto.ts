import { IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../../common/constants/permissions.constant';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    description: 'Array of permissions granted to this role',
    example: ['pos.use', 'orders.view', 'orders.manage', 'payments.process'],
    enum: Permission,
    isArray: true,
  })
  @IsArray()
  @IsEnum(Permission, { each: true, message: 'Each permission must be a valid Permission enum value' })
  permissions: Permission[];
}
