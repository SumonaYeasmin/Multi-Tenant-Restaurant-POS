import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantRoleModule } from './tenant-role/tenant-role.module';
import { StaffModule } from './staff/staff.module';
import { BranchModule } from './branch/branch.module';
import { CategoryModule } from './category/category.module';
import { ModifierGroupModule } from './modifier-group/modifier-group.module';
import { ComboModule } from './combo/combo.module';
import { MenuItemModule } from './menu-item/menu-item.module';
import { InventoryModule } from './inventory/inventory.module';
import { RecipeModule } from './recipe/recipe.module';
import { StockMovementModule } from './stock-movement/stock-movement.module';

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
    InventoryModule,
    RecipeModule,
    StockMovementModule,
  ],
  exports: [
    TenantRoleModule,
    StaffModule,
    BranchModule,
    CategoryModule,
    ModifierGroupModule,
    ComboModule,
    MenuItemModule,
    InventoryModule,
    RecipeModule,
    StockMovementModule,
  ],
})
export class ModulesModule {}
