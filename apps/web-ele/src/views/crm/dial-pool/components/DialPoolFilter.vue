<script setup lang="ts">
import { computed } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import type { DialPoolFilterForm, DialPoolOptions } from '../types';
import { customerStatusOptions } from '../types';

const model = defineModel<DialPoolFilterForm>({ required: true });
const props = defineProps<{ loading: boolean; options: DialPoolOptions }>();
const emit = defineEmits<{ reset: []; search: [] }>();

const gradeOptions = computed(() => {
  if (!model.value.schoolId) return props.options.grades;
  const school = props.options.schools.find(
    (item) => item.id === model.value.schoolId,
  );
  const gradeCodes = new Set(school?.gradeCodes ?? []);
  return props.options.grades.filter((item) =>
    gradeCodes.has(item.gradeCode),
  );
});

function handleSchoolChange() {
  if (
    model.value.gradeCode &&
    !gradeOptions.value.some(
      (item) => item.gradeCode === model.value.gradeCode,
    )
  ) {
    model.value.gradeCode = undefined;
  }
}
</script>

<template>
  <div class="dial-pool-filter">
    <ElInput
      v-model="model.customerName"
      clearable
      placeholder="客户姓名"
      style="width: 150px"
      @keyup.enter="emit('search')"
    />
    <ElInput
      v-model="model.phone"
      clearable
      placeholder="客户手机号"
      style="width: 170px"
      @keyup.enter="emit('search')"
    />
    <ElSelect
      v-model="model.status"
      clearable
      placeholder="客户状态"
      style="width: 130px"
    >
      <ElOption
        v-for="item in customerStatusOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </ElSelect>
    <ElSelect
      v-model="model.teamId"
      clearable
      filterable
      placeholder="所属团队"
      style="width: 160px"
    >
      <ElOption
        v-for="item in options.teams"
        :key="item.id"
        :label="item.teamName"
        :value="item.id"
      />
    </ElSelect>
    <ElSelect
      v-model="model.schoolId"
      clearable
      filterable
      placeholder="所属学校"
      style="width: 180px"
      @change="handleSchoolChange"
    >
      <ElOption
        v-for="item in options.schools"
        :key="item.id"
        :label="item.schoolName"
        :value="item.id"
      />
    </ElSelect>
    <ElSelect
      v-model="model.gradeCode"
      clearable
      filterable
      placeholder="所属年级"
      style="width: 140px"
    >
      <ElOption
        v-for="item in gradeOptions"
        :key="item.gradeCode"
        :label="item.gradeName"
        :value="item.gradeCode"
      />
    </ElSelect>
    <ElDatePicker
      v-model="model.statusUpdatedAtRange"
      end-placeholder="修改结束时间"
      range-separator="至"
      start-placeholder="修改开始时间"
      style="width: 360px"
      type="datetimerange"
    />
    <ElSelect
      v-model="model.statusUpdatedByEmployeeId"
      clearable
      filterable
      placeholder="修改员工"
      style="width: 150px"
    >
      <ElOption
        v-for="item in options.employees"
        :key="item.id"
        :label="item.realName"
        :value="item.id"
      />
    </ElSelect>
    <ElButton :loading="loading" type="primary" @click="emit('search')">
      查询
    </ElButton>
    <ElButton :disabled="loading" @click="emit('reset')">重置</ElButton>
  </div>
</template>

<style scoped>
.dial-pool-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>

