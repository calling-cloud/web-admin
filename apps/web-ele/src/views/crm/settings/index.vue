<script lang="ts" setup>
import { onMounted, reactive, shallowRef } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import { settingsApi, updateSettingsApi } from '#/api';

const accessStore = useAccessStore();
const userStore = useUserStore();
const canSave = shallowRef(false);
const loading = shallowRef(false);
const form = reactive({
  allowRepeatAssign: false,
  appLoginTtlDays: 7,
  appUpdateApkUrl: '',
  appUpdateChangelog: '',
  appUpdateForce: false,
  appUpdateMinVersionCode: 0,
  appUpdateSha256: '',
  appUpdateVersionCode: 0,
  appUpdateVersionName: '',
  dealNotifyEnabled: false,
  dingtalkPushEnabled: false,
  dingtalkWebhookUrl: '',
  invalidPersonalHistoryDays: 30,
  invalidPersonalMinHistoryHandled: 50,
  invalidPersonalMinRateDiffPercent: 20,
  invalidPersonalMinTodayHandled: 10,
  invalidPersonalRateMultiplierPercent: 200,
  invalidPersonalRiskEnabled: true,
  invalidTeamMinHandled: 50,
  invalidTeamMinRateDiffPercent: 15,
  invalidTeamMinTodayHandled: 10,
  invalidTeamRateMultiplierPercent: 200,
  invalidTeamRiskEnabled: true,
  loginCaptchaEnabled: true,
  maxAssignCount: 3,
  repeatAssignContactedOnly: false,
  repeatAssignIntervalHours: 24,
  repeatAssignMinIntentLevel: 3,
  statusRiskBurstCount: 20,
  statusRiskBurstAutoRestoreEnabled: false,
  statusRiskBurstEnabled: true,
  statusRiskBurstWindowMinutes: 10,
  statusRiskCallWithinHours: 24,
  statusRiskEnabled: false,
  statusRiskAction: 1 as 1 | 2,
  statusRiskMinCallSeconds: 10,
  statusRiskRequireCallEnabled: true,
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
      appUpdateForce: !!data.appUpdateForce,
      dealNotifyEnabled: !!data.dealNotifyEnabled,
      dingtalkPushEnabled: !!data.dingtalkPushEnabled,
      invalidPersonalRiskEnabled: !!data.invalidPersonalRiskEnabled,
      invalidTeamRiskEnabled: !!data.invalidTeamRiskEnabled,
      loginCaptchaEnabled: !!data.loginCaptchaEnabled,
      repeatAssignContactedOnly: !!data.repeatAssignContactedOnly,
      statusRiskBurstEnabled: !!data.statusRiskBurstEnabled,
      statusRiskBurstAutoRestoreEnabled:
        !!data.statusRiskBurstAutoRestoreEnabled,
      statusRiskEnabled: !!data.statusRiskEnabled,
      statusRiskRequireCallEnabled: !!data.statusRiskRequireCallEnabled,
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
    userStore.userRoles.includes('admin') ||
    accessStore.accessCodes.includes('CrmSettings:update')
  );
}

onMounted(load);
</script>

<template>
  <Page title="系统设置">
    <ElCard>
      <ElForm :model="form" label-width="220px" style="max-width: 760px">
        <div class="title">系统安全</div>
        <ElFormItem label="启用验证码登录">
          <ElSwitch v-model="form.loginCaptchaEnabled" />
        </ElFormItem>
        <ElFormItem label="App登录有效期（天）">
          <ElInputNumber v-model="form.appLoginTtlDays" :min="1" />
        </ElFormItem>
        <div class="title">App更新</div>
        <ElFormItem label="最新整数版本号">
          <ElInputNumber v-model="form.appUpdateVersionCode" :min="0" />
        </ElFormItem>
        <ElFormItem label="展示版本名">
          <ElInput
            v-model="form.appUpdateVersionName"
            clearable
            placeholder="例如 1.2"
          />
        </ElFormItem>
        <ElFormItem label="最低可用版本号">
          <ElInputNumber v-model="form.appUpdateMinVersionCode" :min="0" />
        </ElFormItem>
        <ElFormItem label="APK下载地址">
          <ElInput
            v-model="form.appUpdateApkUrl"
            clearable
            placeholder="请输入 APK 下载地址"
          />
        </ElFormItem>
        <ElFormItem label="APK SHA256">
          <ElInput
            v-model="form.appUpdateSha256"
            clearable
            placeholder="为空则跳过校验"
          />
        </ElFormItem>
        <ElFormItem label="强制更新">
          <ElSwitch v-model="form.appUpdateForce" />
        </ElFormItem>
        <ElFormItem label="更新日志">
          <ElInput
            v-model="form.appUpdateChangelog"
            :rows="3"
            clearable
            placeholder="多行可用 \\n 分隔"
            type="textarea"
          />
        </ElFormItem>
        <div class="title">推送设置</div>
        <ElFormItem label="企微推送">
          <ElSwitch v-model="form.wecomPushEnabled" />
        </ElFormItem>
        <ElFormItem v-if="form.wecomPushEnabled" label="企微webHook地址">
          <ElInput
            v-model="form.wecomWebhookUrl"
            clearable
            placeholder="请输入企微webHook地址"
          />
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
        <div class="title">客户状态风险控制</div>
        <ElFormItem label="启用状态风险检测">
          <ElSwitch v-model="form.statusRiskEnabled" />
        </ElFormItem>
        <ElFormItem label="风控后执行逻辑">
          <ElRadioGroup
            v-model="form.statusRiskAction"
            :disabled="!form.statusRiskEnabled"
          >
            <ElRadio :value="1">禁止操作</ElRadio>
            <ElRadio :value="2">账号封禁</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="短时间连续标记检测">
          <ElSwitch
            v-model="form.statusRiskBurstEnabled"
            :disabled="!form.statusRiskEnabled"
          />
        </ElFormItem>
        <ElFormItem label="自动恢复标记客户">
          <ElSwitch
            v-model="form.statusRiskBurstAutoRestoreEnabled"
            :disabled="!form.statusRiskEnabled || !form.statusRiskBurstEnabled"
          />
        </ElFormItem>
        <ElFormItem label="连续标记时间窗口（分钟）">
          <ElInputNumber
            v-model="form.statusRiskBurstWindowMinutes"
            :disabled="!form.statusRiskEnabled || !form.statusRiskBurstEnabled"
            :max="1440"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="连续标记客户数阈值">
          <ElInputNumber
            v-model="form.statusRiskBurstCount"
            :disabled="!form.statusRiskEnabled || !form.statusRiskBurstEnabled"
            :min="2"
          />
        </ElFormItem>
        <ElDivider />
        <ElFormItem label="要求存在有效通话">
          <ElSwitch
            v-model="form.statusRiskRequireCallEnabled"
            :disabled="!form.statusRiskEnabled"
          />
        </ElFormItem>
        <ElFormItem label="有效通话回溯（小时）">
          <ElInputNumber
            v-model="form.statusRiskCallWithinHours"
            :disabled="
              !form.statusRiskEnabled || !form.statusRiskRequireCallEnabled
            "
            :max="720"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="有效通话最短时长（秒）">
          <ElInputNumber
            v-model="form.statusRiskMinCallSeconds"
            :disabled="
              !form.statusRiskEnabled || !form.statusRiskRequireCallEnabled
            "
            :max="86_400"
            :min="0"
          />
        </ElFormItem>
        <ElDivider />
        <ElFormItem label="个人历史无效率检测">
          <ElSwitch
            v-model="form.invalidPersonalRiskEnabled"
            :disabled="!form.statusRiskEnabled"
          />
        </ElFormItem>
        <ElFormItem label="个人历史回溯（天）">
          <ElInputNumber
            v-model="form.invalidPersonalHistoryDays"
            :disabled="
              !form.statusRiskEnabled || !form.invalidPersonalRiskEnabled
            "
            :max="365"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="个人无效率倍数（%）">
          <ElInputNumber
            v-model="form.invalidPersonalRateMultiplierPercent"
            :disabled="
              !form.statusRiskEnabled || !form.invalidPersonalRiskEnabled
            "
            :min="100"
          />
        </ElFormItem>
        <ElFormItem label="个人最小百分点差">
          <ElInputNumber
            v-model="form.invalidPersonalMinRateDiffPercent"
            :disabled="
              !form.statusRiskEnabled || !form.invalidPersonalRiskEnabled
            "
            :max="100"
            :min="0"
          />
        </ElFormItem>
        <ElFormItem label="个人当日最小样本数">
          <ElInputNumber
            v-model="form.invalidPersonalMinTodayHandled"
            :disabled="
              !form.statusRiskEnabled || !form.invalidPersonalRiskEnabled
            "
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="个人历史最小样本数">
          <ElInputNumber
            v-model="form.invalidPersonalMinHistoryHandled"
            :disabled="
              !form.statusRiskEnabled || !form.invalidPersonalRiskEnabled
            "
            :min="1"
          />
        </ElFormItem>
        <ElDivider />
        <ElFormItem label="团队平均无效率检测">
          <ElSwitch
            v-model="form.invalidTeamRiskEnabled"
            :disabled="!form.statusRiskEnabled"
          />
        </ElFormItem>
        <ElFormItem label="团队无效率倍数（%）">
          <ElInputNumber
            v-model="form.invalidTeamRateMultiplierPercent"
            :disabled="!form.statusRiskEnabled || !form.invalidTeamRiskEnabled"
            :min="100"
          />
        </ElFormItem>
        <ElFormItem label="团队最小百分点差">
          <ElInputNumber
            v-model="form.invalidTeamMinRateDiffPercent"
            :disabled="!form.statusRiskEnabled || !form.invalidTeamRiskEnabled"
            :max="100"
            :min="0"
          />
        </ElFormItem>
        <ElFormItem label="团队比较个人最小样本数">
          <ElInputNumber
            v-model="form.invalidTeamMinTodayHandled"
            :disabled="!form.statusRiskEnabled || !form.invalidTeamRiskEnabled"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="团队其他员工最小样本数">
          <ElInputNumber
            v-model="form.invalidTeamMinHandled"
            :disabled="!form.statusRiskEnabled || !form.invalidTeamRiskEnabled"
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
