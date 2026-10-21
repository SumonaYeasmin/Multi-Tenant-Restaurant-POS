import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TenantRoleService } from './tenant-role.service';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@ApiTags('(Tenant) Roles & Permissions')
@Controller('tenants')
export class TenantRoleController {
  constructor(private readonly tenantRoleService: TenantRoleService) {}

  @Get(':tenantSlug/roles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ROLES_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all roles and permissions for a tenant',
    description: 'Returns the full matrix of roles and their dynamic permissions for the specified restaurant tenant.',
  })
  @ApiResponse({ status: 200, description: 'Roles and permissions retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getTenantRoles(@Param('tenantSlug') tenantSlug: string) {
    const roles = await this.tenantRoleService.getTenantRoles(tenantSlug);
    return ResponseHelper.success(roles, 'Roles and permissions retrieved successfully');
  }

  @Put(':tenantSlug/roles/:role/permissions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.STAFF_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update permissions for a specific role in a tenant',
    description: 'Allows restaurant admin/owner to customize permissions (check/uncheck) for a role.',
  })
  @ApiParam({ name: 'tenantSlug', example: 'sultans-dine', description: 'Restaurant slug' })
  @ApiParam({ name: 'role', example: 'CASHIER', description: 'Role name (OWNER, MANAGER, CASHIER, KITCHEN, WAITER)' })
  @ApiResponse({ status: 200, description: 'Role permissions updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role or invalid permissions array' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async updateRolePermissions(
    @Param('tenantSlug') tenantSlug: string,
    @Param('role') role: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    const updated = await this.tenantRoleService.updateRolePermissions(
      tenantSlug,
      role,
      dto,
    );
    return ResponseHelper.success(
      updated,
      `Permissions for role ${updated.role} updated successfully`,
    );
  }
}
