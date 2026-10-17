import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantRoleModule } from './tenant-role/tenant-role.module';
import { StaffModule } from './staff/staff.module';
import { BranchModule } from './branch/branch.module';

@Module({
  imports: [AuthModule, TenantRoleModule, StaffModule, BranchModule],
  exports: [TenantRoleModule, StaffModule, BranchModule],
})
export class ModulesModule {}
