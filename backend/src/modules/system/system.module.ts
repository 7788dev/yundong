import { Module } from '@nestjs/common';
import { PoseModule } from '../pose/pose.module';
import { SystemController } from './system.controller';

@Module({
  imports: [PoseModule],
  controllers: [SystemController],
})
export class SystemModule {}
