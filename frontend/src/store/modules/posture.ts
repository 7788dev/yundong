import { defineStore } from "pinia";
import {
  analyzeAssessment,
  generatePlan,
  getAssessmentResult,
  getPlan,
  startAssessment,
  submitAnswers
} from "@/api/posture";
import { store } from "../utils";

type PostureState = {
  currentSessionId: number | null;
  currentPlanId: number | null;
  latestResult: Record<string, unknown> | null;
  latestPlan: Record<string, unknown> | null;
  loading: boolean;
};

export const usePostureStore = defineStore("posture-platform", {
  state: (): PostureState => ({
    currentSessionId: null,
    currentPlanId: null,
    latestResult: null,
    latestPlan: null,
    loading: false
  }),
  actions: {
    async runAssessmentFlow(
      answers: Array<{ questionId: number; optionId: number }>
    ) {
      this.loading = true;
      try {
        const session = await startAssessment();
        this.currentSessionId = session.id;
        await submitAnswers(session.id, answers);
        const result = await analyzeAssessment(session.id);
        this.latestResult = result as unknown as Record<string, unknown>;
        return result;
      } finally {
        this.loading = false;
      }
    },
    async fetchResult(sessionId: number) {
      this.loading = true;
      try {
        const result = await getAssessmentResult(sessionId);
        this.latestResult = result as unknown as Record<string, unknown>;
        return result;
      } finally {
        this.loading = false;
      }
    },
    async createPlan(sessionId: number) {
      this.loading = true;
      try {
        const plan = await generatePlan(sessionId);
        this.currentPlanId = plan.id;
        this.latestPlan = plan as unknown as Record<string, unknown>;
        return plan;
      } finally {
        this.loading = false;
      }
    },
    async fetchPlan(planId: number) {
      this.loading = true;
      try {
        const plan = await getPlan(planId);
        this.currentPlanId = plan.id;
        this.latestPlan = plan as unknown as Record<string, unknown>;
        return plan;
      } finally {
        this.loading = false;
      }
    }
  }
});

export function usePostureStoreHook() {
  return usePostureStore(store);
}
