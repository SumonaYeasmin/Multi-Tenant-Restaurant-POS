import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ModifierGroupService } from './modifier-group.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Menu Modifier Groups')
@Controller('tenants')
export class ModifierGroupController {
  constructor(private readonly modifierGroupService: ModifierGroupService) {}

  @Post(':tenantSlug/modifier-groups')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new modifier group',
    description: 'Creates a modifier group with customization rules (min, max, options) for menu items.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Modifier group created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 409, description: 'Modifier group with this name already exists' })
  async createModifierGroup(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateModifierGroupDto,
  ) {
    const group = await this.modifierGroupService.createModifierGroup(
      tenantSlug,
      dto,
    );
    return ResponseHelper.created(group, 'Modifier group created successfully');
  }

  @Get(':tenantSlug/modifier-groups')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all modifier groups for the restaurant',
    description: 'Retrieves all modifier groups with their nested options.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier groups retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async getAllModifierGroups(@Param('tenantSlug') tenantSlug: string) {
    const groups = await this.modifierGroupService.getAllModifierGroups(
      tenantSlug,
    );
    return ResponseHelper.success(groups, 'Modifier groups retrieved successfully');
  }

  @Get(':tenantSlug/modifier-groups/:groupId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific modifier group',
    description: 'Retrieves a single modifier group with its nested options by ID.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier group retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Modifier group or restaurant not found' })
  async getModifierGroupById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
  ) {
    const group = await this.modifierGroupService.getModifierGroupById(
      tenantSlug,
      groupId,
    );
    return ResponseHelper.success(group, 'Modifier group retrieved successfully');
  }

  @Put(':tenantSlug/modifier-groups/:groupId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update modifier group and options',
    description: 'Updates modifier group details (name, min, max) and replaces/updates nested options.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier group updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Modifier group or restaurant not found' })
  @ApiResponse({ status: 409, description: 'Modifier group with this name already exists' })
  async updateModifierGroup(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateModifierGroupDto,
  ) {
    const group = await this.modifierGroupService.updateModifierGroup(
      tenantSlug,
      groupId,
      dto,
    );
    return ResponseHelper.success(group, 'Modifier group updated successfully');
  }

  @Delete(':tenantSlug/modifier-groups/:groupId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a modifier group',
    description: 'Deletes a modifier group and its associated options.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier group deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Modifier group or restaurant not found' })
  async deleteModifierGroup(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.modifierGroupService.deleteModifierGroup(
      tenantSlug,
      groupId,
    );
    return ResponseHelper.success(result, 'Modifier group deleted successfully');
  }

  @Post(':tenantSlug/modifier-groups/:groupId/options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add an option to a modifier group',
    description: 'Creates a new customizable option (e.g. Extra Cheese) under a specific modifier group.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Modifier option created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Modifier group or restaurant not found' })
  @ApiResponse({ status: 409, description: 'Modifier option with this name already exists in this group' })
  async createModifierOption(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierOptionDto,
  ) {
    const option = await this.modifierGroupService.createModifierOption(
      tenantSlug,
      groupId,
      dto,
    );
    return ResponseHelper.created(option, 'Modifier option created successfully');
  }

  @Get(':tenantSlug/modifier-groups/:groupId/options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all options for a modifier group',
    description: 'Retrieves all customizable options under a specific modifier group.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier options retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Modifier group or restaurant not found' })
  async getAllModifierOptions(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
  ) {
    const options = await this.modifierGroupService.getAllModifierOptions(
      tenantSlug,
      groupId,
    );
    return ResponseHelper.success(options, 'Modifier options retrieved successfully');
  }

  @Get(':tenantSlug/modifier-groups/:groupId/options/:optionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific modifier option',
    description: 'Retrieves a single modifier option by ID under a modifier group.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiParam({
    name: 'optionId',
    example: 'uuid',
    description: 'Modifier Option ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier option retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Modifier option or group not found' })
  async getModifierOptionById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
    @Param('optionId') optionId: string,
  ) {
    const option = await this.modifierGroupService.getModifierOptionById(
      tenantSlug,
      groupId,
      optionId,
    );
    return ResponseHelper.success(option, 'Modifier option retrieved successfully');
  }

  @Put(':tenantSlug/modifier-groups/:groupId/options/:optionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a modifier option',
    description: 'Updates details of a modifier option (name, price, active status).',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiParam({
    name: 'optionId',
    example: 'uuid',
    description: 'Modifier Option ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier option updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Modifier option or group not found' })
  @ApiResponse({ status: 409, description: 'Modifier option with this name already exists in this group' })
  async updateModifierOption(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateModifierOptionDto,
  ) {
    const option = await this.modifierGroupService.updateModifierOption(
      tenantSlug,
      groupId,
      optionId,
      dto,
    );
    return ResponseHelper.success(option, 'Modifier option updated successfully');
  }

  @Delete(':tenantSlug/modifier-groups/:groupId/options/:optionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.MENU_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a modifier option',
    description: 'Soft deletes a modifier option from the group.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'groupId',
    example: 'uuid',
    description: 'Modifier Group ID',
  })
  @ApiParam({
    name: 'optionId',
    example: 'uuid',
    description: 'Modifier Option ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Modifier option deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Modifier option or group not found' })
  async deleteModifierOption(
    @Param('tenantSlug') tenantSlug: string,
    @Param('groupId') groupId: string,
    @Param('optionId') optionId: string,
  ) {
    const result = await this.modifierGroupService.deleteModifierOption(
      tenantSlug,
      groupId,
      optionId,
    );
    return ResponseHelper.success(result, 'Modifier option deleted successfully');
  }
}


