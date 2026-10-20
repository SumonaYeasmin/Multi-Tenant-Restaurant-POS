import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { GetTablesQueryDto } from './dto/get-tables-query.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions.constant';

@ApiTags('(Tenant) Dining Tables')
@Controller('tenants')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Post(':tenantSlug/tables')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new dining table',
    description:
      'Creates a new dining table with branch, name, seats, area, shape, and canvas coordinates.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 201,
    description: 'Dining table created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Restaurant or branch not found' })
  @ApiResponse({
    status: 409,
    description: 'Table with this name already exists in this branch',
  })
  async createTable(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateTableDto,
  ) {
    const table = await this.tableService.createTable(tenantSlug, dto);
    return ResponseHelper.created(table, 'Dining table created successfully');
  }

  @Get(':tenantSlug/tables')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all dining tables of the restaurant',
    description:
      'Retrieves all dining tables for the restaurant or branch, with optional filters for status, area, and search. Ideal for floor plans and POS table selectors.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Dining tables retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant or branch not found' })
  async getTables(
    @Param('tenantSlug') tenantSlug: string,
    @Query() query: GetTablesQueryDto,
  ) {
    const tables = await this.tableService.getTables(tenantSlug, query);
    return ResponseHelper.success(
      tables,
      'Dining tables retrieved successfully',
    );
  }

  @Get(':tenantSlug/tables/:tableId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a specific dining table',
    description:
      'Retrieves a single dining table by its ID, including active order info if occupied.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'tableId',
    example: 'uuid',
    description: 'Dining table ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Dining table retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Dining table or restaurant not found',
  })
  async getTableById(
    @Param('tenantSlug') tenantSlug: string,
    @Param('tableId') tableId: string,
  ) {
    const table = await this.tableService.getTableById(tenantSlug, tableId);
    return ResponseHelper.success(table, 'Dining table retrieved successfully');
  }

  @Put(':tenantSlug/tables/:tableId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update dining table configuration',
    description:
      'Updates details of an existing dining table (name, seats, area, position, shape, status).',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'tableId',
    example: 'uuid',
    description: 'Dining table ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Dining table updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Dining table or restaurant not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Table with this name already exists in this branch',
  })
  async updateTable(
    @Param('tenantSlug') tenantSlug: string,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateTableDto,
  ) {
    const table = await this.tableService.updateTable(
      tenantSlug,
      tableId,
      dto,
    );
    return ResponseHelper.success(table, 'Dining table updated successfully');
  }

  @Patch(':tenantSlug/tables/:tableId/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_VIEW)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update table operational status',
    description:
      'Updates the operational status of a table (e.g. AVAILABLE, OCCUPIED, RESERVED, CLEANING). Accessible to cashiers, waiters, and managers.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'tableId',
    example: 'uuid',
    description: 'Dining table ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Table status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Dining table or restaurant not found',
  })
  async updateTableStatus(
    @Param('tenantSlug') tenantSlug: string,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateTableStatusDto,
  ) {
    const table = await this.tableService.updateTableStatus(
      tenantSlug,
      tableId,
      dto.status,
    );
    return ResponseHelper.success(
      table,
      'Table status updated successfully',
    );
  }

  @Delete(':tenantSlug/tables/:tableId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.TABLES_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft delete a dining table',
    description:
      'Soft deletes a dining table. Protects against deleting tables that are currently occupied or have active orders.',
  })
  @ApiParam({
    name: 'tenantSlug',
    example: 'sultans-dine',
    description: 'Restaurant slug',
  })
  @ApiParam({
    name: 'tableId',
    example: 'uuid',
    description: 'Dining table ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Dining table deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Dining table or restaurant not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete occupied table or table with active orders',
  })
  async deleteTable(
    @Param('tenantSlug') tenantSlug: string,
    @Param('tableId') tableId: string,
  ) {
    const result = await this.tableService.softDeleteTable(
      tenantSlug,
      tableId,
    );
    return ResponseHelper.success(result, 'Dining table deleted successfully');
  }
}
