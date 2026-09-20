<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { customerStatusOptions } from '../types';

const visible = defineModel<boolean>('visible', { required: true });
const props = defineProps<{
  count: number;
  loading: boolean;
  mode: 'filtered' | 'selected' | 'single';
}>();
const emit = defineEmits<{
  submit: [payload: { password: string; status: number }];
}>();
const form = reactive({ password: '', status: undefined as number | undefined });

const title = computed(() => {
  if (props.mode === 'single') return '修改客户状态';
  if (props.mode === 'selected') return `修改已选 ${props.count} 位客户状态`;
  return `按筛选条件修改全部 ${props.count} 位客户状态`;
});

watch(visible, (value) => {
  if (!value) return;
  form.password = '';
  form.status = undefined;
});

function submit() {
  if (!form.status) return;
  emit('submit', { password: form.password, status: form.status });
}
</script>

<template>
  <ElDialog v-model="visible" :close-on-click-modal="false" :title="title" width="500px">
    <ElAlert
      v-if="mode === 'filtered'"
      class="status-warning"
      :closable="false"
      show-icon
      title="这是风险操作。系统将按当前筛选条件修改全部匹配客户，并记录完整审计日志。"
      type="warning"
    />
    <ElForm :model="form" label-width="96px" @submit.prevent="submit">
      <ElFormItem label="目标状态" required>
        <ElSelect v-model="form.status" placeholder="请选择目标状态" style="width: 100%">
          <ElOption
            v-for="item in customerStatusOptions"
            :key="item.value"
            :disabled="item.value === 2 || item.value === 3"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="mode === 'filtered'" label="账号密码" required>
        <ElInput
          v-model="form.password"
          autocomplete="current-password"
          placeholder="请输入当前登录账号密码"
          show-password
          type="password"
          @keyup.enter="submit"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton :disabled="loading" @click="visible = false">取消</ElButton>
      <ElButton
        :disabled="!form.status || (mode === 'filtered' && !form.password)"
        :loading="loading"
        :type="mode === 'filtered' ? 'danger' : 'primary'"
        @click="submit"
      >
        确认修改
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.status-warning {
  margin-bottom: 20px;
}
</style>
