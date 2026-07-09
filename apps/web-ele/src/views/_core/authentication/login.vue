<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { HTMLAttributes } from 'vue';

import { computed, defineComponent, h, markRaw, onMounted, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { cn } from '@vben/utils';

import { captchaApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const captchaId = ref('');
const captchaImage = ref('');

function normalizeCaptchaSvg(svg: string) {
  return svg
    .replaceAll(/(stroke|fill)="(?!none|transparent)[^"]*"/g, '$1="currentColor"')
    .replace('<svg ', '<svg class="size-full" preserveAspectRatio="xMidYMid meet" ');
}

async function refreshCaptcha() {
  const data = await captchaApi();
  captchaId.value = data.captchaId;
  captchaImage.value = normalizeCaptchaSvg(data.image);
}

const CaptchaImage = defineComponent({
  name: 'CaptchaImage',
  setup() {
    return () =>
      h('button', {
        class:
          'h-10 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-background p-1 text-foreground',
        innerHTML: captchaImage.value || '刷新',
        title: '点击刷新验证码',
        type: 'button',
        onClick: refreshCaptcha,
      });
  },
});

const CaptchaInput = defineComponent({
  name: 'CaptchaInput',
  props: {
    class: null,
    modelValue: [Number, String],
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    onMounted(refreshCaptcha);
    return () =>
      h('div', { class: 'flex w-full gap-2' }, [
        h('input', {
          class: cn(
            'border-input bg-background h-10 min-w-0 flex-1 rounded-md border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50',
            props.class as HTMLAttributes['class'],
          ),
          placeholder: props.placeholder,
          value: props.modelValue ?? '',
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        }),
        h(CaptchaImage),
      ]);
  },
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(CaptchaInput),
      componentProps: {
        placeholder: '请输入图片验证码',
      },
      fieldName: 'captcha',
      label: '图片验证码',
      rules: z.string().min(1, { message: '请输入图片验证码' }),
    },
  ];
});

async function handleLogin(values: Record<string, any>) {
  await authStore.authLogin({ ...values, captchaId: captchaId.value });
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-forget-password="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-third-party-login="false"
    sub-title="使用账号、密码和图片验证码登录"
    title="销售管理后台"
    @submit="handleLogin"
  />
</template>
