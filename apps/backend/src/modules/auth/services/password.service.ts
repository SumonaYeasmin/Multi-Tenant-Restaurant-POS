import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import * as bcrypt from 'bcrypt';
import {
    NotFoundException,
    UnauthorizedException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class PasswordService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.password) {
            throw new NotFoundException('User');
        }

        const isPasswordValid = await bcrypt.compare(
            dto.oldPassword,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid old password');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return ResponseHelper.success(null, 'Password changed successfully');
    }
}