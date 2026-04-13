<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getModelConfigApi, updateModelConfigApi } from "@/api/posture";

const loading = ref(false);
const form = reactive({
  provider: "disabled",
  threshold: 0.5,
  fallback: true
});

async function loadConfig() {
  loading.value = true;
  try {
    const res = await getModelConfigApi();
    form.provider = String(res.provider ?? "disabled");
    form.threshold = Number(res.threshold ?? 0.5);
    form.fallback = Boolean(res.fallback ?? true);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  loading.value = true;
  try {
    await updateModelConfigApi({
      provider: form.provider,
      threshold: form.threshold,
      fallback: form.fallback
    });
    ElMessage.success("系统设置已保存");
  } catch (error) {
    console.error(error);
    ElMessage.error("保存失败");
  } finally {
    loading.value = false;
  }
}

onMounted(loadConfig);
</script>

<template>
  <div class="page">
    <h2>系统设置</h2>
    <div class="field">
      <label>姿态模型 Provider</label>
      <input
        v-model="form.provider"
        placeholder="disabled / mock / mediapipe"
      />
    </div>
    <div class="field">
      <label>置信度阈值</label>
      <input
        v-model.number="form.threshold"
        type="number"
        step="0.1"
        min="0"
        max="1"
      />
    </div>
    <div class="field">
      <label>识别失败自动降级</label>
      <input v-model="form.fallback" type="checkbox" />
    </div>
    <button :disabled="loading" @click="onSave">保存设置</button>
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
  margin: 12px 0;
}

label {
  min-width: 160px;
}
</style>
