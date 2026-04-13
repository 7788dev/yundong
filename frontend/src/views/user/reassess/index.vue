<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { compareReassessments } from "@/api/posture";

const form = reactive({
  baselineSessionId: 1,
  currentSessionId: 2
});

const loading = ref(false);
const result = ref<{ totalDelta: number; recommendation: string } | null>(null);

async function onCompare() {
  loading.value = true;
  try {
    const res = await compareReassessments(
      form.baselineSessionId,
      form.currentSessionId
    );
    result.value = res.improvement;
  } catch (error) {
    console.error(error);
    ElMessage.error("复评对比失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page">
    <h2>复评对比</h2>

    <div class="field">
      <label>基线评估 Session ID</label>
      <input v-model.number="form.baselineSessionId" type="number" min="1" />
    </div>
    <div class="field">
      <label>当前评估 Session ID</label>
      <input v-model.number="form.currentSessionId" type="number" min="1" />
    </div>

    <button :disabled="loading" @click="onCompare">开始对比</button>

    <div v-if="result" class="result">
      <p>总分变化：{{ result.totalDelta }}</p>
      <p>建议：{{ result.recommendation }}</p>
    </div>
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
  gap: 10px;
  align-items: center;
  margin: 10px 0;
}

label {
  min-width: 180px;
}

.result {
  padding: 12px;
  margin-top: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}
</style>
