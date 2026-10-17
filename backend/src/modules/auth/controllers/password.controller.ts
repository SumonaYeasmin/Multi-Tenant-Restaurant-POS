import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PasswordService } from '../services/password.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('(Auth) Password')
@Controller('auth')
export class AuthPasswordController {
    constructor(private readonly passwordService: PasswordService) { }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change password for authenticated user' })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized or invalid old password',
    })
    async changePassword(
        @CurrentUser() user: any,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.passwordService.changePassword(user.id, dto);
    }
}