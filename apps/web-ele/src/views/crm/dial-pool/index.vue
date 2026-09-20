<script setup lang="ts">
import type {
  DialPoolCustomer,
  DialPoolFilters,
  DialPoolOperation,
} from '#/api';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
} from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCard,
  ElMessage,
  ElPagination,
  ElProgress,
} from 'element-plus';

import {
  batchUpdateDialPoolCustomerStatusApi,
  getDialPoolOperationApi,
  listDialPoolCustomersApi,
  optionsApi,
  previewDialPoolFilterStatusApi,
  updateDialPoolCustomerStatusApi,
  updateDialPoolFilterStatusApi,
} from '#/api';
import { encryptSensitiveText } from '#/utils/sensitive-crypto';

import CustomerStatusTable from './components/CustomerStatusTable.vue';
import DialPoolFilter from './components/DialPoolFilter.vue';
import StatusChangeDialog from './components/StatusChangeDialog.vue';
import type { DialPoolFilterForm, DialPoolOptions } from './types';

defineOptions({ name: 'CrmDialPool' });

const accessStore = useAccessStore();
const userStore = useUserStore();
const loading = shallowRef(false);
const actionLoading = shallowRef(false);
const rows = shallowRef<DialPoolCustomer[]>([]);
const selectedRows = shallowRef<DialPoolCustomer[]>([]);
const total = shallowRef(0);
const page = shallowRef(1);
const pageSize = shallowRef(20);
const dialogVisible = shallowRef(false);
const dialogMode = shallowRef<'filtered' | 'selected' | 'single'>('single');
const dialogCount = shallowRef(1);
const targetCustomer = shallowRef<DialPoolCustomer>();
const previewCount = shallowRef(0);
const activeOperation = shallowRef<DialPoolOperation>();
let operationTimer: ReturnType<typeof setTimeout> | undefined;
const operationStorageKey = 'dial-pool-active-operation-id';

const query = ref<DialPoolFilterForm>({
  customerName: '',
  phone: '',
  statusUpdatedAtRange: [],
});
const options = reactive<DialPoolOptions>({
  employees: [],
  grades: [],
  schools: [],
  teams: [],
});

function hasButton(action: string) {
  return (
    userStore.userRoles.includes('admin') ||
    accessStore.accessCodes.includes(`dial-pool:${action}`)
  );
}

const canUpdate = computed(() => hasButton('updateStatus'));
const canBatchUpdate = computed(() => hasButton('batchUpdateStatus'));
const canFilterUpdate = computed(() => hasButton('filterUpdateStatus'));
const selectedIds = computed(() => selectedRows.value.map((item) => item.id));
const operationPercentage = computed(() => {
  const operation = activeOperation.value;
  if (!operation?.totalCount) return operation?.status === 3 ? 100 : 0;
  return Math.min(
    100,
    Math.round((operation.processedCount / operation.totalCount) * 100),
  );
});

function requestFilters(): DialPoolFilters {
  const value = query.value;
  const range = value.statusUpdatedAtRange;
  return {
    customerName: value.customerName?.trim() || undefined,
    gradeCode: value.gradeCode,
    phone: value.phone?.trim() || undefined,
    schoolId: value.schoolId,
    status: value.status,
    statusUpdatedAtEnd: range[1]?.toISOString(),
    statusUpdatedAtStart: range[0]?.toISOString(),
    statusUpdatedByEmployeeId: value.statusUpdatedByEmployeeId,
    teamId: value.teamId,
  };
}

async function loadOptions() {
  const result = await optionsApi(['dicts', 'schools', 'teams', 'employees']);
  options.employees = result.employees ?? [];
  options.grades = result.dicts?.grades ?? [];
  options.schools = result.schools ?? [];
  options.teams = result.teams ?? [];
}

async function loadData() {
  loading.value = true;
  try {
    const result = await listDialPoolCustomersApi({
      ...requestFilters(),
      page: page.value,
      pageSize: pageSize.value,
    });
    rows.value = result.items ?? [];
    total.value = result.total ?? 0;
    selectedRows.value = [];
  } finally {
    loading.value = false;
  }
}

function search() {
  page.value = 1;
  void loadData();
}

function reset() {
  query.value = {
    customerName: '',
    gradeCode: undefined,
    phone: '',
    schoolId: undefined,
    status: undefined,
    statusUpdatedAtRange: [],
    statusUpdatedByEmployeeId: undefined,
    teamId: undefined,
  };
  search();
}

function openSingle(row: DialPoolCustomer) {
  targetCustomer.value = row;
  dialogMode.value = 'single';
  dialogCount.value = 1;
  dialogVisible.value = true;
}

function openSelected() {
  dialogMode.value = 'selected';
  dialogCount.value = selectedIds.value.length;
  dialogVisible.value = true;
}

async function openFiltered() {
  actionLoading.value = true;
  try {
    const result = await previewDialPoolFilterStatusApi(requestFilters());
    if (!result.total) {
      ElMessage.warning('当前筛选条件没有匹配客户');
      return;
    }
    previewCount.value = result.total;
    dialogMode.value = 'filtered';
    dialogCount.value = result.total;
    dialogVisible.value = true;
  } finally {
    actionLoading.value = false;
  }
}

function stopOperationPolling() {
  if (operationTimer) clearTimeout(operationTimer);
  operationTimer = undefined;
}

async function pollOperation(id: string) {
  stopOperationPolling();
  const operation = await getDialPoolOperationApi(id);
  activeOperation.value = operation;
  if (operation.status === 3) {
    sessionStorage.removeItem(operationStorageKey);
    ElMessage.success(
      `批量修改完成：成功 ${operation.changedCount} 条，跳过 ${operation.skippedCount} 条`,
    );
    await loadData();
    return;
  }
  if (operation.status === 4) {
    sessionStorage.removeItem(operationStorageKey);
    ElMessage.error(operation.failureMessage || '批量修改失败');
    return;
  }
  operationTimer = setTimeout(() => void pollOperation(id), 2_000);
}

async function submitStatus(payload: { password: string; status: number }) {
  actionLoading.value = true;
  try {
    if (dialogMode.value === 'single' && targetCustomer.value) {
      const result = await updateDialPoolCustomerStatusApi(
        targetCustomer.value.id,
        payload.status,
      );
      ElMessage.success(`已修改 ${result.affected} 条客户状态`);
      dialogVisible.value = false;
      await loadData();
      return;
    }
    if (dialogMode.value === 'selected') {
      const result = await batchUpdateDialPoolCustomerStatusApi(
        selectedIds.value,
        payload.status,
      );
      ElMessage.success(
        `已修改 ${result.affected} 条，跳过 ${result.skipped} 条`,
      );
      dialogVisible.value = false;
      await loadData();
      return;
    }

    const operation = await updateDialPoolFilterStatusApi({
      expectedCount: previewCount.value,
      filters: requestFilters(),
      password: await encryptSensitiveText(payload.password),
      status: payload.status,
    });
    activeOperation.value = operation;
    sessionStorage.setItem(operationStorageKey, operation.id);
    dialogVisible.value = false;
    ElMessage.success('批量修改任务已创建');
    void pollOperation(operation.id);
  } finally {
    actionLoading.value = false;
  }
}

function operationAlertType() {
  if (activeOperation.value?.status === 4) return 'error';
  if (activeOperation.value?.status === 3) return 'success';
  return 'info';
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadData()]);
  const operationId = sessionStorage.getItem(operationStorageKey);
  if (operationId) void pollOperation(operationId);
});
onBeforeUnmount(stopOperationPolling);
</script>

<template>
  <Page
    auto-content-height
    content-class="dial-pool-content"
    title="拨号池管理"
  >
    <div class="dial-pool-page">
      <ElCard class="dial-pool-search-card" shadow="never">
        <DialPoolFilter
          v-model="query"
          :loading="loading"
          :options="options"
          @reset="reset"
          @search="search"
        />
      </ElCard>

      <ElAlert
        v-if="activeOperation"
        class="dial-pool-operation"
        :closable="activeOperation.status === 3 || activeOperation.status === 4"
        :title="
          activeOperation.status === 4
            ? `批量任务失败：${activeOperation.failureMessage}`
            : `批量任务：已处理 ${activeOperation.processedCount}/${activeOperation.totalCount}，已修改 ${activeOperation.changedCount}，跳过 ${activeOperation.skippedCount}`
        "
        :type="operationAlertType()"
        show-icon
        @close="activeOperation = undefined"
      >
        <ElProgress
          :percentage="operationPercentage"
          :status="
            activeOperation.status === 4
              ? 'exception'
              : activeOperation.status === 3
                ? 'success'
                : undefined
          "
        />
      </ElAlert>

      <ElCard class="dial-pool-table-card" shadow="never">
        <div class="dial-pool-toolbar">
          <div>共 {{ total }} 位客户，已选择 {{ selectedIds.length }} 位</div>
          <div class="dial-pool-actions">
            <ElButton
              v-if="canBatchUpdate"
              :disabled="!selectedIds.length"
              type="primary"
              @click="openSelected"
            >
              修改已选客户状态
            </ElButton>
            <ElButton
              v-if="canFilterUpdate"
              :loading="actionLoading"
              type="danger"
              @click="openFiltered"
            >
              按筛选条件修改全部
            </ElButton>
          </div>
        </div>

        <div class="dial-pool-table">
          <CustomerStatusTable
            :can-select="canBatchUpdate"
            :can-update="canUpdate"
            :loading="loading"
            :rows="rows"
            @selection-change="selectedRows = $event"
            @update="openSingle"
          />
        </div>

        <div class="dial-pool-pagination">
          <ElPagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next"
            @change="loadData"
          />
        </div>
      </ElCard>
    </div>

    <StatusChangeDialog
      v-model:visible="dialogVisible"
      :count="dialogCount"
      :loading="actionLoading"
      :mode="dialogMode"
      @submit="submitStatus"
    />
  </Page>
</template>

<style scoped>
:deep(.dial-pool-content) {
  min-height: 0;
  overflow: hidden;
}

.dial-pool-page {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.dial-pool-search-card,
.dial-pool-operation {
  flex: none;
}

.dial-pool-table-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.dial-pool-table-card :deep(.el-card__body) {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.dial-pool-toolbar,
.dial-pool-actions,
.dial-pool-pagination {
  display: flex;
  align-items: center;
}

.dial-pool-toolbar {
  flex: none;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dial-pool-actions {
  gap: 8px;
}

.dial-pool-table {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.dial-pool-pagination {
  flex: none;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
