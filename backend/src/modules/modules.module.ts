import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantRoleModule } from './tenant-role/tenant-role.module';
import { StaffModule } from './staff/staff.module';
import { BranchModule } from './branch/branch.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [AuthModule, TenantRoleModule, StaffModule, BranchModule, CategoryModule],
  exports: [TenantRoleModule, StaffModule, BranchModule, CategoryModule],
})
export class ModulesModule {}
