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
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Suppliers')
@Controller('tenants')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post(':tenantSlug/suppliers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PURCHASING_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new supplier',
    description: 'Creates a new supplier vendor for the restaurant tenant.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({
    status: 409,
    description: 'Supplier with this name already exists',
  })
  async createSupplier(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateSupplierDto,
  ) {
    const supplier = await this.supplierService.createSupplier(tenantSlug, dto);
    return ResponseHelper.created(supplier, 'Supplier created successfully');
  }
}
