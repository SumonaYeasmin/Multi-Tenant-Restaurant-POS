import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Branches')
@Controller('tenants')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post(':tenantSlug/branches')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.BRANCHES_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new branch for the restaurant',
    description: 'Creates a physical branch/location under the restaurant tenant.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Branch created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 409, description: 'Branch with this name already exists' })
  async createBranch(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateBranchDto,
  ) {
    const branch = await this.branchService.createBranch(tenantSlug, dto);
    return ResponseHelper.created(branch, 'Branch created successfully');
  }
}
