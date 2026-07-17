<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import { settingsApi, updateSettingsApi } from '#/api';

const accessStore = useAccessStore();
const userStore = useUserStore();
const canSave = ref(false);
const loading = ref(false);
const form = reactive({
  allowRepeatAssign: false,
  appLoginTtlDays: 7,
  dealNotifyEnabled: false,
  dingtalkPushEnabled: false,
  dingtalkWebhookUrl: '',
  loginCaptchaEnabled: true,
  maxAssignCount: 3,
  repeatAssignContactedOnly: false,
  repeatAssignIntervalHours: 24,
  repeatAssignMinIntentLevel: 3,
  wecomPushEnabled: false,
  wecomWebhookUrl: '',
});

const intentOptions = [
  { label: '未知', value: 0 },
  { label: '基本无意向', value: 1 },
  { label: '较低', value: 2 },
  { label: '中', value: 3 },
  { label: '高', value: 4 },
  { label: '强烈', value: 5 },
];

async function load() {
  canSave.value = false;
  try {
    const data = await settingsApi();
    Object.assign(form, {
      ...data,
      allowRepeatAssign: !!data.allowRepeatAssign,
      dealNotifyEnabled: !!data.dealNotifyEnabled,
      dingtalkPushEnabled: !!data.dingtalkPushEnabled,
      loginCaptchaEnabled: !!data.loginCaptchaEnabled,
      repeatAssignContactedOnly: !!data.repeatAssignContactedOnly,
      wecomPushEnabled: !!data.wecomPushEnabled,
    });
    canSave.value = true;
  } catch {}
}

async function save() {
  if (!canSave.value) return;
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
    userStore.userRoles.includes('admin') || accessStore.accessCodes.includes('CrmSettings:update')
  );
}

onMounted(load);
</script>

<template>
  <Page title="系统设置">
    <ElCard>
      <ElForm :model="form" label-width="190px" style="max-width: 680px">
        <div class="title">系统安全</div>
        <ElFormItem label="启用验证码登录">
          <ElSwitch v-model="form.loginCaptchaEnabled" />
        </ElFormItem>
        <ElFormItem label="App登录有效期（天）">
          <ElInputNumber v-model="form.appLoginTtlDays" :min="1" />
        </ElFormItem>
        <div class="title">推送设置</div>
        <ElFormItem label="企微推送">
          <ElSwitch v-model="form.wecomPushEnabled" />
        </ElFormItem>
        <ElFormItem v-if="form.wecomPushEnabled" label="企微webHook地址">
          <ElInput v-model="form.wecomWebhookUrl" clearable placeholder="请输入企微webHook地址" />
        </ElFormItem>
        <ElFormItem label="钉钉推送">
          <ElSwitch v-model="form.dingtalkPushEnabled" />
        </ElFormItem>
        <ElFormItem v-if="form.dingtalkPushEnabled" label="钉钉webHook地址">
          <ElInput
            v-model="form.dingtalkWebhookUrl"
            clearable
            placeholder="请输入钉钉webHook地址"
          />
        </ElFormItem>
        <ElFormItem label="成交喜报推送">
          <ElSwitch v-model="form.dealNotifyEnabled" />
        </ElFormItem>
        <div class="title">客户分配</div>
        <ElFormItem label="允许重复分配客户">
          <ElSwitch v-model="form.allowRepeatAssign" />
        </ElFormItem>
        <ElFormItem label="只分配给联系过的员工">
          <ElSwitch v-model="form.repeatAssignContactedOnly" :disabled="!form.allowRepeatAssign" />
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
            :disabled="!canSave"
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

<style lang="scss" scoped>
.title {
  font-size: 16px;
  height: 20px;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 12px;
  margin: 12px;
  &::after {
    position: absolute;
    inset: 0;
    display: block;
    content: '';
    width: 4px;
    height: 100%;
    background-color: var(--el-color-primary);
  }
}
</style>
