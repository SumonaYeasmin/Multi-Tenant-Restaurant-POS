import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantRoleService } from './tenant-role.service';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('(Tenant) Roles & Permissions')
@Controller('tenants')
export class TenantRoleController {
  constructor(private readonly tenantRoleService: TenantRoleService) {}

  @Get(':tenantSlug/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all roles and permissions for a tenant',
    description: 'Returns the full matrix of roles and their dynamic permissions for the specified restaurant tenant.',
  })
  @ApiResponse({ status: 200, description: 'Roles and permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getTenantRoles(@Param('tenantSlug') tenantSlug: string) {
    const roles = await this.tenantRoleService.getTenantRoles(tenantSlug);
    return ResponseHelper.success(roles, 'Roles and permissions retrieved successfully');
  }
}
