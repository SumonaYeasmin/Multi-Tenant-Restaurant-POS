import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Get(':tenantSlug/combos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all combo meals',
    description: 'Retrieves all available combo meals and their included items.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Combos retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getAllCombos(@Param('tenantSlug') tenantSlug: string) {
    const combos = await this.comboService.getAllCombos(tenantSlug);
    return ResponseHelper.success(combos, 'Combos retrieved successfully');
  }

  @Get(':tenantSlug/combos/:comboId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific combo meal',
    description: 'Retrieves a single combo meal with its included items by ID.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'comboId',
    example: 'uuid',
    description: 'Combo ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Combo retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Combo or restaurant not found' })
  async getComboById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('comboId') comboId: string,
  ) {
    const combo = await this.comboService.getComboById(tenantSlug, comboId);
    return ResponseHelper.success(combo, 'Combo retrieved successfully');
  }
}

