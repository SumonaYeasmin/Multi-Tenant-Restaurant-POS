import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantRoleModule } from './tenant-role/tenant-role.module';
import { StaffModule } from './staff/staff.module';

@Module({
  imports: [AuthModule, TenantRoleModule, StaffModule],
  exports: [TenantRoleModule, StaffModule],
})
export class ModulesModule {}
