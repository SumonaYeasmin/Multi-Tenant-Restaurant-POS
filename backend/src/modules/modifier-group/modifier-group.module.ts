import { Module } from '@nestjs/common';
import { ModifierGroupController } from './modifier-group.controller';
import { ModifierGroupService } from './modifier-group.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ModifierGroupController],
  providers: [ModifierGroupService],
  exports: [ModifierGroupService],
})
export class ModifierGroupModule {}
