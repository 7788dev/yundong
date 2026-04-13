export type PoseAnalyzeResult = {
  modelName?: string;
  modelVersion?: string;
  landmarks?: Record<string, unknown>;
  metrics: Record<string, number>;
  confidence: number;
  fallbackUsed: boolean;
};

export interface PoseProvider {
  isAvailable(): Promise<boolean>;
  analyze(files: string[]): Promise<PoseAnalyzeResult>;
}
