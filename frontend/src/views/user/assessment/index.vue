<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  startAssessment,
  submitAnswers,
  analyzeAssessment
} from "@/api/posture";

const router = useRouter();
const loading = ref(false);

const form = reactive({
  neck: 2,
  pelvis: 2
});

async function onSubmit() {
  loading.value = true;
  try {
    const session = await startAssessment();
    await submitAnswers(session.id, [
      { questionId: 1, optionId: form.neck },
      { questionId: 2, optionId: form.pelvis }
    ]);
    await analyzeAssessment(session.id);
    ElMessage.success("评估完成");
    await router.push(`/u/result/${session.id}`);
  } catch (error) {
    console.error(error);
    ElMessage.error("评估提交失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page">
    <h2>体态评估</h2>
    <p>填写基础问卷后自动生成体态分析与康复建议。</p>

    <div class="field">
      <label>颈肩不适程度</label>
      <input v-model.number="form.neck" type="number" min="1" max="4" />
    </div>

    <div class="field">
      <label>骨盆稳定性问题程度</label>
      <input v-model.number="form.pelvis" type="number" min="1" max="4" />
    </div>

    <button :disabled="loading" @click="onSubmit">提交评估</button>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.field {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 12px 0;
}

label {
  min-width: 160px;
}

input {
  width: 120px;
}
</style>
