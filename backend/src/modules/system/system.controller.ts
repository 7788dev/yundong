import { Controller, Get } from '@nestjs/common';
import { PoseService } from '../pose/pose.service';

@Controller('system/model')
export class SystemController {
  constructor(private readonly poseService: PoseService) {}

  @Get('status')
  status() {
    return this.poseService.status();
  }
}
