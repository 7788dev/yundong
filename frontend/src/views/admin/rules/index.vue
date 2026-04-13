<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { createRuleApi, listRulesApi } from "@/api/posture";

const list = ref<any[]>([]);
const loading = ref(false);

async function fetchList() {
  loading.value = true;
  try {
    list.value = await listRulesApi();
  } catch (error) {
    console.error(error);
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function onCreate() {
  try {
    await createRuleApi({
      ruleName: `新规则-${Date.now()}`,
      problemType: "head_forward",
      conditionJson: {
        any: [{ domain: "neck_shoulder", gte: 60 }]
      },
      priority: 50,
      enabled: true
    });
    ElMessage.success("规则已新增");
    await fetchList();
  } catch (error) {
    console.error(error);
    ElMessage.error("新增规则失败");
  }
}

onMounted(fetchList);
</script>

<template>
  <div class="page">
    <div class="header">
      <h2>规则管理</h2>
      <button @click="onCreate">新增规则</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>规则名</th>
          <th>问题类型</th>
          <th>优先级</th>
          <th>启用</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>{{ item.ruleName }}</td>
          <td>{{ item.problemType }}</td>
          <td>{{ item.priority }}</td>
          <td>{{ item.enabled ? "是" : "否" }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="!list.length && !loading">暂无规则</p>
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
  margin-bottom: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px;
  border: 1px solid #ebeef5;
}
</style>
