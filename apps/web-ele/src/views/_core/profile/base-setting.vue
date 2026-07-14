<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import OSS from 'ali-oss';
import { ElAvatar, ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus';

import {
  getOssStsApi,
  getUserInfoApi,
  updateUserProfileApi,
} from '#/api';

const maxAvatarSize = 2 * 1024 * 1024;
const avatarPreviewUrl = ref('');
const fileInputRef = ref<HTMLInputElement>();
const loading = ref(false);
const uploading = ref(false);
const userStore = useUserStore();
const form = reactive({
  avatar: '',
  phone: '',
  realName: '',
  username: '',
});

function setForm(data: Record<string, any>) {
  form.avatar = data.avatar ?? '';
  form.phone = data.phone ?? '';
  form.realName = data.realName ?? '';
  form.username = data.username ?? '';
}

async function refreshUserInfo() {
  const data = await getUserInfoApi();
  userStore.setUserInfo(data);
  setForm(data);
}

async function uploadAvatar(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件');
    return;
  }
  if (file.size > maxAvatarSize) {
    ElMessage.error('头像大小不能超过 2MB');
    return;
  }

  uploading.value = true;
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
  avatarPreviewUrl.value = URL.createObjectURL(file);
  try {
    const sts = await getOssStsApi();
    const client = new OSS({
      accessKeyId: sts.accessKeyId,
      accessKeySecret: sts.accessKeySecret,
      bucket: sts.bucket,
      region: sts.region,
      secure: true,
      stsToken: sts.stsToken,
    });
    const result = await client.put(`${sts.dir}${file.name}`, file, {
      headers: { 'x-oss-object-acl': 'public-read' },
    }) as { name?: string; url?: string };
    form.avatar = result.url ?? `${sts.host}/${result.name}`;
    ElMessage.success('头像上传成功');
  } catch (error) {
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarPreviewUrl.value = '';
    ElMessage.error(error instanceof Error ? error.message : '头像上传失败');
  } finally {
    uploading.value = false;
  }
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) await uploadAvatar(file);
}

async function handleSubmit() {
  loading.value = true;
  try {
    await updateUserProfileApi(form);
    await refreshUserInfo();
    ElMessage.success('基本信息已更新');
  } finally {
    loading.value = false;
  }
}

onMounted(refreshUserInfo);
onBeforeUnmount(() => {
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
});
</script>

<template>
  <div class="max-w-xl">
    <ElForm label-width="88px" :model="form" @submit.prevent>
      <ElFormItem label="头像">
        <div class="flex items-center gap-4">
          <ElAvatar
            :size="72"
            :src="avatarPreviewUrl || form.avatar || preferences.app.defaultAvatar"
          />
          <div class="flex flex-col gap-2">
            <ElButton
              :loading="uploading"
              type="primary"
              @click="fileInputRef?.click()"
            >
              上传头像
            </ElButton>
            <span class="text-sm text-foreground/60">支持 2MB 以内图片</span>
          </div>
          <input
            ref="fileInputRef"
            accept="image/*"
            class="hidden"
            type="file"
            @change="handleAvatarChange"
          />
        </div>
      </ElFormItem>
      <ElFormItem label="姓名" required>
        <ElInput v-model="form.realName" placeholder="请输入姓名" />
      </ElFormItem>
      <ElFormItem label="用户名" required>
        <ElInput v-model="form.username" placeholder="请输入用户名" />
      </ElFormItem>
      <ElFormItem label="手机号" required>
        <ElInput v-model="form.phone" placeholder="请输入手机号" />
      </ElFormItem>
      <ElFormItem>
        <ElButton :loading="loading" type="primary" @click="handleSubmit">
          更新基本信息
        </ElButton>
      </ElFormItem>
    </ElForm>
  </div>
</template>
