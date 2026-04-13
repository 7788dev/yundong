import { Injectable } from '@nestjs/common';
import { PoseAnalyzeResult, PoseProvider } from './pose.types';
import { DisabledPoseProvider } from './providers/disabled.provider';
import { MediaPipePoseProvider } from './providers/mediapipe.provider';
import { MockPoseProvider } from './providers/mock.provider';

@Injectable()
export class PoseService {
  private provider: PoseProvider;

  constructor() {
    const providerName = process.env.POSE_PROVIDER ?? 'disabled';
    this.provider =
      providerName === 'mock'
        ? new MockPoseProvider()
        : providerName === 'mediapipe'
          ? new MediaPipePoseProvider()
          : new DisabledPoseProvider();
  }

  async status() {
    const available = await this.provider.isAvailable();
    return {
      provider: process.env.POSE_PROVIDER ?? 'disabled',
      available,
    };
  }

  async analyze(files: string[]): Promise<PoseAnalyzeResult> {
    const available = await this.provider.isAvailable();
    if (!available) {
      return {
        modelName: 'disabled',
        modelVersion: 'n/a',
        landmarks: {},
        metrics: {},
        confidence: 0,
        fallbackUsed: true,
      };
    }

    const result = await this.provider.analyze(files);
    const threshold = Number(process.env.POSE_CONFIDENCE_THRESHOLD ?? 0.5);
    if (result.confidence < threshold) {
      return {
        ...result,
        metrics: {},
        fallbackUsed: true,
      };
    }
    return result;
  }
}
