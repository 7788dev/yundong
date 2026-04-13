<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { createActionApi, listActionsApi } from "@/api/posture";

const list = ref<any[]>([]);
const loading = ref(false);

async function fetchList() {
  loading.value = true;
  try {
    list.value = await listActionsApi();
  } catch (error) {
    console.error(error);
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function onCreate() {
  try {
    await createActionApi({
      code: `A_NEW_${Date.now()}`,
      name: "示例激活动作",
      targetProblem: "head_forward",
      steps: "保持核心稳定完成动作",
      durationSec: 30,
      sets: 2
    });
    ElMessage.success("动作已新增");
    await fetchList();
  } catch (error) {
    console.error(error);
    ElMessage.error("新增动作失败");
  }
}

onMounted(fetchList);
</script>

<template>
  <div class="page">
    <div class="header">
      <h2>动作库管理</h2>
      <button @click="onCreate">新增动作</button>
    </div>

    <ul>
      <li v-for="item in list" :key="item.id">
        {{ item.name }}（{{ item.targetProblem }}）- {{ item.durationSec }} 秒 *
        {{ item.sets }} 组
      </li>
    </ul>
    <p v-if="!list.length && !loading">暂无动作</p>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
