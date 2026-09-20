<script setup lang="ts">
import type { DialPoolCustomer } from '#/api';

import {
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { customerStatusOptions } from '../types';

defineProps<{
  canSelect: boolean;
  canUpdate: boolean;
  loading: boolean;
  rows: DialPoolCustomer[];
}>();
const emit = defineEmits<{
  selectionChange: [rows: DialPoolCustomer[]];
  update: [row: DialPoolCustomer];
}>();

function statusLabel(status: number) {
  return (
    customerStatusOptions.find((item) => item.value === status)?.label ?? '-'
  );
}

function statusType(status: number) {
  if (status === 3) return 'success';
  if (status === 4) return 'danger';
  if (status === 2) return 'warning';
  return 'info';
}

function dateText(value?: null | string) {
  return value ? new Date(value).toLocaleString() : '-';
}

function updateRow(row: unknown) {
  emit('update', row as DialPoolCustomer);
}
</script>

<template>
  <ElTable
    v-loading="loading"
    :data="rows"
    height="100%"
    row-key="id"
    stripe
    @selection-change="emit('selectionChange', $event)"
  >
    <ElTableColumn
      v-if="canSelect"
      type="selection"
      width="48"
    />
    <ElTableColumn label="客户姓名" min-width="110" prop="customerName" />
    <ElTableColumn label="客户手机号" min-width="130" prop="phone" />
    <ElTableColumn label="客户状态" min-width="100">
      <template #default="{ row }">
        <ElTag :type="statusType(row.status)">
          {{ statusLabel(row.status) }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="所属团队" min-width="140" prop="teamName">
      <template #default="{ row }">{{ row.teamName || '-' }}</template>
    </ElTableColumn>
    <ElTableColumn label="所属学校" min-width="160" prop="schoolName" />
    <ElTableColumn label="所属年级" min-width="100" prop="gradeName" />
    <ElTableColumn label="修改时间" min-width="180">
      <template #default="{ row }">
        {{ dateText(row.statusUpdatedAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="修改员工"
      min-width="110"
      prop="statusUpdatedByEmployeeName"
    >
      <template #default="{ row }">
        {{ row.statusUpdatedByEmployeeName || '-' }}
      </template>
    </ElTableColumn>
    <ElTableColumn v-if="canUpdate" fixed="right" label="操作" width="100">
      <template #default="{ row }">
        <ElButton link type="primary" @click="updateRow(row)">
          修改状态
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
