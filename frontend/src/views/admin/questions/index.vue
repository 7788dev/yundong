<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { createQuestionApi, listQuestionsApi } from "@/api/posture";

const loading = ref(false);
const list = ref<any[]>([]);

async function fetchList() {
  loading.value = true;
  try {
    list.value = await listQuestionsApi();
  } catch (error) {
    console.error(error);
    list.value = [];
  } finally {
    loading.value = false;
  }
}

async function onCreate() {
  try {
    const code = `Q_NEW_${Date.now()}`;
    await createQuestionApi({
      code,
      category: "neck_shoulder",
      questionText: "新增示例题目",
      weight: 1
    });
    ElMessage.success("题目已新增");
    await fetchList();
  } catch (error) {
    console.error(error);
    ElMessage.error("新增失败");
  }
}

onMounted(fetchList);
</script>

<template>
  <div class="page">
    <div class="header">
      <h2>题库管理</h2>
      <button @click="onCreate">新增题目</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>编码</th>
          <th>分类</th>
          <th>题目</th>
          <th>权重</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.code }}</td>
          <td>{{ item.category }}</td>
          <td>{{ item.questionText }}</td>
          <td>{{ item.weight }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="!list.length && !loading">暂无数据</p>
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
