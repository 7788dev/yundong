import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AssessmentPage from "../assessment/index.vue";

const mockRouterPush = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mockRouterPush
  })
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const startAssessment = vi.fn();
const submitAnswers = vi.fn();
const analyzeAssessment = vi.fn();

vi.mock("@/api/posture", () => ({
  startAssessment: (...args: any[]) => startAssessment(...args),
  submitAnswers: (...args: any[]) => submitAnswers(...args),
  analyzeAssessment: (...args: any[]) => analyzeAssessment(...args)
}));

describe("AssessmentPage", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    startAssessment.mockReset();
    submitAnswers.mockReset();
    analyzeAssessment.mockReset();

    startAssessment.mockResolvedValue({ id: 123 });
    submitAnswers.mockResolvedValue({ count: 2 });
    analyzeAssessment.mockResolvedValue({
      questionnaireScore: { total: 66 }
    });
  });

  it("submits assessment and navigates to result page", async () => {
    const wrapper = mount(AssessmentPage);
    await wrapper.get("button").trigger("click");
    await Promise.resolve();

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("/u/result/")
    );
  });
});
