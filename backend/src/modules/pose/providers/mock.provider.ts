import { PoseAnalyzeResult, PoseProvider } from '../pose.types';

export class MockPoseProvider implements PoseProvider {
  async isAvailable() {
    return true;
  }

  async analyze(_files: string[]): Promise<PoseAnalyzeResult> {
    return {
      modelName: 'mock-pose',
      modelVersion: '1.0.0',
      landmarks: {
        points: 33,
      },
      metrics: {
        headForwardAngle: 18,
        shoulderAsymmetry: 6,
        pelvicTilt: 10,
        qAngle: 14,
      },
      confidence: 0.86,
      fallbackUsed: false,
    };
  }
}
