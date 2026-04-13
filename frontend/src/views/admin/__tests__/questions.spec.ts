import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminQuestionsPage from "../questions/index.vue";

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const listQuestionsApi = vi.fn();
const createQuestionApi = vi.fn();

vi.mock("@/api/posture", () => ({
  listQuestionsApi: (...args: any[]) => listQuestionsApi(...args),
  createQuestionApi: (...args: any[]) => createQuestionApi(...args)
}));

describe("AdminQuestionsPage", () => {
  beforeEach(() => {
    listQuestionsApi.mockReset();
    createQuestionApi.mockReset();

    listQuestionsApi.mockResolvedValue([]);
    createQuestionApi.mockResolvedValue({ id: 1 });
  });

  it("admin can create question from form", async () => {
    const wrapper = mount(AdminQuestionsPage);
    await wrapper.get("button").trigger("click");
    await Promise.resolve();

    expect(createQuestionApi).toHaveBeenCalled();
  });
});
