import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantRoleModule } from './tenant-role/tenant-role.module';
import { StaffModule } from './staff/staff.module';
import { BranchModule } from './branch/branch.module';
import { CategoryModule } from './category/category.module';
import { ModifierGroupModule } from './modifier-group/modifier-group.module';
import { ComboModule } from './combo/combo.module';
import { MenuItemModule } from './menu-item/menu-item.module';

@Module({
  imports: [
    AuthModule,
    TenantRoleModule,
    StaffModule,
    BranchModule,
    CategoryModule,
    ModifierGroupModule,
    ComboModule,
    MenuItemModule,
  ],
  exports: [
    TenantRoleModule,
    StaffModule,
    BranchModule,
    CategoryModule,
    ModifierGroupModule,
    ComboModule,
    MenuItemModule,
  ],
})
export class ModulesModule {}
