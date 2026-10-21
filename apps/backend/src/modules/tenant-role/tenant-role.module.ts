import { Module } from '@nestjs/common';
import { TenantRoleController } from './tenant-role.controller';
import { TenantRoleService } from './tenant-role.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantRoleController],
  providers: [TenantRoleService],
  exports: [TenantRoleService],
})
export class TenantRoleModule {}
