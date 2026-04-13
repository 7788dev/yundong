<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { getPlan, logPlanProgress } from "@/api/posture";

type PlanItem = {
  id: number;
  weekNo: number;
  dayNo: number;
  action: {
    name: string;
    targetProblem: string;
    level: string;
    steps: string;
    durationSec: number;
    sets: number;
  };
};

const route = useRoute();
const loading = ref(false);
const plan = ref<{ id: number; weeks: number; items: PlanItem[] } | null>(null);

const planId = computed(() => Number(route.params.id));

async function loadPlan() {
  if (!planId.value) return;
  loading.value = true;
  try {
    plan.value = await getPlan(planId.value);
  } catch (error) {
    console.error(error);
    ElMessage.error("计划加载失败");
  } finally {
    loading.value = false;
  }
}

async function markDone(item: PlanItem) {
  if (!plan.value) return;
  try {
    const res = await logPlanProgress(plan.value.id, item.id, {
      done: true,
      painLevel: 3,
      feedback: "completed"
    });
    ElMessage.success(`已记录，系统建议：${res.adjustment}`);
  } catch (error) {
    console.error(error);
    ElMessage.error("打卡失败");
  }
}

onMounted(loadPlan);
</script>

<template>
  <div class="page">
    <h2>康复计划</h2>
    <p v-if="plan">计划ID：{{ plan.id }} / 周期：{{ plan.weeks }} 周</p>
    <p v-else-if="loading">加载中...</p>
    <p v-else>暂无计划数据</p>

    <div v-if="plan" class="list">
      <div v-for="item in plan.items" :key="item.id" class="card">
        <h4>
          Week {{ item.weekNo }} / Day {{ item.dayNo }} - {{ item.action.name }}
        </h4>
        <p>
          目标问题：{{ item.action.targetProblem }}（{{ item.action.level }}）
        </p>
        <p>
          建议：{{ item.action.steps }} / {{ item.action.durationSec }} 秒 *
          {{ item.action.sets }} 组
        </p>
        <button @click="markDone(item)">完成打卡</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.list {
  display: grid;
  gap: 12px;
}

.card {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
</style>
