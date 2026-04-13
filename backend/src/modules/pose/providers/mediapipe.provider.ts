import { PoseAnalyzeResult, PoseProvider } from '../pose.types';

/**
 * 预留的 MediaPipe Provider。
 * 当前仓库未内置浏览器/wasm 推理链路，因此默认不可用。
 * 后续接入后只需把 isAvailable 返回 true 并补全 analyze 逻辑。
 */
export class MediaPipePoseProvider implements PoseProvider {
  async isAvailable() {
    return false;
  }

  async analyze(_files: string[]): Promise<PoseAnalyzeResult> {
    return {
      modelName: 'mediapipe',
      modelVersion: 'placeholder',
      landmarks: {},
      metrics: {},
      confidence: 0,
      fallbackUsed: true,
    };
  }
}
