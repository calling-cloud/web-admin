<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import { settingsApi, updateSettingsApi } from '#/api';

const accessStore = useAccessStore();
const userStore = useUserStore();
const loading = ref(false);
const form = reactive({
  allowRepeatAssign: false,
  loginCaptchaEnabled: true,
  maxAssignCount: 3,
  repeatAssignContactedOnly: false,
  repeatAssignIntervalHours: 24,
  repeatAssignMinIntentLevel: 3,
});

const intentOptions = [
  { label: '未知', value: 0 },
  { label: '基本无意向', value: 1 },
  { label: '中', value: 2 },
  { label: '高', value: 3 },
  { label: '强烈', value: 4 },
];

async function load() {
  const data = await settingsApi();
  Object.assign(form, {
    ...data,
    allowRepeatAssign: !!data.allowRepeatAssign,
    loginCaptchaEnabled: !!data.loginCaptchaEnabled,
    repeatAssignContactedOnly: !!data.repeatAssignContactedOnly,
  });
}

async function save() {
  loading.value = true;
  try {
    await updateSettingsApi(form);
    ElMessage.success('保存成功');
  } finally {
    loading.value = false;
  }
}

function hasSavePermission() {
  return (
    userStore.userRoles.includes('admin') ||
    accessStore.accessCodes.includes('CrmSettings:update')
  );
}

onMounted(load);
</script>

<template>
  <Page title="系统设置">
    <ElCard>
      <ElForm :model="form" label-width="190px" style="max-width: 680px">
        <ElFormItem label="启用验证码登录">
          <ElSwitch v-model="form.loginCaptchaEnabled" />
        </ElFormItem>
        <ElFormItem label="允许重复分配客户">
          <ElSwitch v-model="form.allowRepeatAssign" />
        </ElFormItem>
        <ElFormItem label="只分配给联系过的员工">
          <ElSwitch
            v-model="form.repeatAssignContactedOnly"
            :disabled="!form.allowRepeatAssign"
          />
        </ElFormItem>
        <ElFormItem label="最低重复分配意向度">
          <ElSelect
            v-model="form.repeatAssignMinIntentLevel"
            :disabled="!form.allowRepeatAssign"
            style="width: 220px"
          >
            <ElOption
              v-for="item in intentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="最大分配次数">
          <ElInputNumber
            v-model="form.maxAssignCount"
            :disabled="!form.allowRepeatAssign"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="重复分配间隔（小时）">
          <ElInputNumber
            v-model="form.repeatAssignIntervalHours"
            :disabled="!form.allowRepeatAssign"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton
            v-if="hasSavePermission()"
            :loading="loading"
            type="primary"
            @click="save"
          >
            保存
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </Page>
</template>
