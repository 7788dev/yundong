<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { generatePlan, getAssessmentResult } from "@/api/posture";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const result = ref<Record<string, any> | null>(null);

const sessionId = computed(() => Number(route.params.id));

async function loadResult() {
  if (!sessionId.value) return;
  loading.value = true;
  try {
    result.value = (await getAssessmentResult(
      sessionId.value
    )) as unknown as Record<string, any>;
  } catch (error) {
    console.error(error);
    ElMessage.error("结果加载失败");
  } finally {
    loading.value = false;
  }
}

async function onGeneratePlan() {
  if (!sessionId.value) return;
  loading.value = true;
  try {
    const plan = await generatePlan(sessionId.value);
    ElMessage.success("康复计划已生成");
    await router.push(`/u/plan/${plan.id}`);
  } catch (error) {
    console.error(error);
    ElMessage.error("计划生成失败");
  } finally {
    loading.value = false;
  }
}

onMounted(loadResult);
</script>

<template>
  <div class="page">
    <h2>评估结果</h2>
    <p>Session ID: {{ sessionId }}</p>

    <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
    <p v-else-if="loading">加载中...</p>
    <p v-else>暂无结果</p>

    <button :disabled="loading" @click="onGeneratePlan">生成康复计划</button>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

pre {
  max-height: 360px;
  padding: 12px;
  margin-bottom: 16px;
  overflow: auto;
  background: #f5f7fa;
  border-radius: 6px;
}
</style>
