import { Module } from '@nestjs/common';
import { PoseService } from './pose.service';

@Module({
  providers: [PoseService],
  exports: [PoseService],
})
export class PoseModule {}
