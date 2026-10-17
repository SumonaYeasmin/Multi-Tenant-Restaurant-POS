import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantRoleModule } from './tenant-role/tenant-role.module';

@Module({
  imports: [AuthModule, TenantRoleModule],
  exports: [TenantRoleModule],
})
export class ModulesModule {}
