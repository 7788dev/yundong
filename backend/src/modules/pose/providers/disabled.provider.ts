import { PoseAnalyzeResult, PoseProvider } from '../pose.types';

export class DisabledPoseProvider implements PoseProvider {
  async isAvailable() {
    return false;
  }

  async analyze(_files: string[]): Promise<PoseAnalyzeResult> {
    return {
      modelName: 'disabled',
      modelVersion: 'n/a',
      landmarks: {},
      metrics: {},
      confidence: 0,
      fallbackUsed: true,
    };
  }
}
