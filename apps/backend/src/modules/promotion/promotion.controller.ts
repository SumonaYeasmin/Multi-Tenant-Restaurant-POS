import {
  Body,
  Controller,
  Get,
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
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Promotions')
@Controller('tenants')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post(':tenantSlug/promotions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROMOTIONS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new promo code / discount',
    description:
      'Creates a new promotional discount code for the tenant restaurant with business validation.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'saffron-ember',
    description: 'Restaurant slug or ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotion created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 409,
    description: 'Promotion with this code already exists',
  })
  async createPromotion(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePromotionDto,
  ) {
    const promotion = await this.promotionService.createPromotion(
      tenantSlug,
      dto,
    );
    return ResponseHelper.created(
      promotion,
      'Promotion created successfully',
    );
  }

  @Get(':tenantSlug/promotions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROMOTIONS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all promotions',
    description: 'Retrieves all promotions created for the restaurant tenant.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'saffron-ember',
    description: 'Restaurant slug or ID',
  })
  async getPromotions(@Param('tenantSlug') tenantSlug: string) {
    const promotions = await this.promotionService.getPromotions(tenantSlug);
    return ResponseHelper.success(
      promotions,
      'Promotions retrieved successfully',
    );
  }

  @Get(':tenantSlug/promotions/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROMOTIONS_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get promotion by ID',
    description: 'Retrieves promotion details by ID.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'saffron-ember',
  })
  @ApiParam({
    name: 'id',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  async getPromotionById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const promotion = await this.promotionService.getPromotionById(
      tenantSlug,
      id,
    );
    return ResponseHelper.success(
      promotion,
      'Promotion retrieved successfully',
    );
  }
}
