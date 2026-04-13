import { http } from "@/utils/http";

export type AssessmentAnswerInput = {
  questionId: number;
  optionId?: number;
  rawValue?: string;
};

export type AssessmentStartResult = {
  id: number;
  userId: number;
  status: string;
};

export type AssessmentAnalyzeResult = {
  sessionId: number;
  questionnaireScore: {
    total: number;
    domains: Record<string, number>;
  };
  pose: {
    fallbackUsed: boolean;
    confidence: number;
    metrics: Record<string, number>;
  };
  diagnosis: Array<{
    problemType: string;
    severity: string;
    evidence: Record<string, unknown>;
  }>;
  finalScore: {
    total: number;
    formula: string;
  };
};

export type PlanResult = {
  id: number;
  weeks: number;
  items: Array<{
    id: number;
    weekNo: number;
    dayNo: number;
    action: {
      id: number;
      name: string;
      targetProblem: string;
      level: string;
      steps: string;
      durationSec: number;
      sets: number;
    };
    prescription: Record<string, unknown>;
  }>;
};

export const startAssessment = () =>
  http.post<AssessmentStartResult, Record<string, never>>("/assessments/start");

export const submitAnswers = (
  sessionId: number,
  answers: AssessmentAnswerInput[]
) =>
  http.post<{ count: number }, { answers: AssessmentAnswerInput[] }>(
    `/assessments/${sessionId}/answers`,
    { data: { answers } }
  );

export const uploadPhotos = (
  sessionId: number,
  photos: Array<{ viewType: "front" | "side" | "back"; filePath: string }>
) =>
  http.post<{ count: number }, { photos: typeof photos }>(
    `/assessments/${sessionId}/photos`,
    { data: { photos } }
  );

export const analyzeAssessment = (sessionId: number, payload?: object) =>
  http.post<AssessmentAnalyzeResult, object>(
    `/assessments/${sessionId}/analyze`,
    {
      data: payload ?? {}
    }
  );

export const getAssessmentResult = (sessionId: number) =>
  http.get<AssessmentAnalyzeResult, Record<string, never>>(
    `/assessments/${sessionId}/result`
  );

export const generatePlan = (sessionId: number) =>
  http.post<PlanResult, Record<string, never>>(`/plans/generate/${sessionId}`);

export const getPlan = (planId: number) =>
  http.get<PlanResult, Record<string, never>>(`/plans/${planId}`);

export const logPlanProgress = (
  planId: number,
  itemId: number,
  payload: { done: boolean; painLevel?: number; feedback?: string }
) =>
  http.post<{ adjustment: "keep" | "regress" }, typeof payload>(
    `/plans/${planId}/items/${itemId}/log`,
    { data: payload }
  );

export const compareReassessments = (
  baselineSessionId: number,
  currentSessionId: number
) =>
  http.post<
    { improvement: { totalDelta: number; recommendation: string } },
    { baselineSessionId: number; currentSessionId: number }
  >("/assessments/reassessments/compare", {
    data: { baselineSessionId, currentSessionId }
  });

export const listQuestionsApi = () =>
  http.get<any[], Record<string, never>>("/admin/questions");

export const createQuestionApi = (payload: {
  code: string;
  category: string;
  questionText: string;
  answerType?: string;
  weight?: number;
}) => http.post<any, typeof payload>("/admin/questions", { data: payload });

export const listActionsApi = () =>
  http.get<any[], Record<string, never>>("/admin/actions");

export const createActionApi = (payload: {
  code: string;
  name: string;
  targetProblem: string;
  level?: string;
  steps: string;
  durationSec?: number;
  sets?: number;
}) => http.post<any, typeof payload>("/admin/actions", { data: payload });

export const listRulesApi = () =>
  http.get<any[], Record<string, never>>("/admin/rules");

export const createRuleApi = (payload: Record<string, unknown>) =>
  http.post<any, Record<string, unknown>>("/admin/rules", { data: payload });

export const getModelConfigApi = () =>
  http.get<Record<string, unknown>, Record<string, never>>(
    "/admin/system/model-config"
  );

export const updateModelConfigApi = (payload: Record<string, unknown>) =>
  http.request<any>("put", "/admin/system/model-config", {
    data: payload
  });
