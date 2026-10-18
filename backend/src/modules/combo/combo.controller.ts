import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ComboService } from './combo.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Menu Combos')
@Controller('tenants')
export class ComboController {
  constructor(private readonly comboService: ComboService) {}

  @Post(':tenantSlug/combos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new combo meal',
    description:
      'Creates a combo meal bundling multiple menu items at a set package price.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Combo created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({
    status: 409,
    description: 'Combo with this name already exists',
  })
  async createCombo(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateComboDto,
  ) {
    const combo = await this.comboService.createCombo(tenantSlug, dto);
    return ResponseHelper.created(combo, 'Combo created successfully');
  }
}
