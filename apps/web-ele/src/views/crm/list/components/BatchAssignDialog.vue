<script setup lang="ts">
import type {
  BatchAssignCustomersInput,
  BatchAssignCustomersResult,
} from '#/api';

import { computed, nextTick, reactive, ref, shallowRef, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElStep,
  ElSteps,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { batchAssignCustomersApi, listApi } from '#/api';

const props = defineProps<{
  employees: Record<string, any>[];
  grades: Record<string, any>[];
  initialCustomerIds?: number[];
  schools: Record<string, any>[];
  teams: Record<string, any>[];
}>();

const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits<{
  success: [affected: number];
}>();

const assignmentModeOptions = [
  { label: '平均分配', value: 1 },
  { label: '首位双权重', value: 2 },
  { label: '偏心分配', value: 3 },
];
const exclusiveModeOptions = [
  { label: '长期有效', value: 1 },
  { label: '分配N次后失效', value: 2 },
];

const activeStep = shallowRef(0);
const customerLoading = shallowRef(false);
const saving = shallowRef(false);
const syncingCustomerSelection = shallowRef(false);
const pendingTotal = shallowRef(0);
const batchAssignResult = shallowRef<BatchAssignCustomersResult | null>(null);
const teamMemberIds = ref<number[]>([]);
const pendingRows = ref<Record<string, any>[]>([]);
const customerTableRef = ref<{
  clearSelection: () => void;
  toggleRowSelection: (row: Record<string, any>, selected?: boolean) => void;
}>();

const form = reactive({
  assignmentMode: 1 as 1 | 2 | 3,
  assignmentWeights: {} as Record<number, number>,
  customerIds: [] as number[],
  employeeIds: [] as number[],
  exclusiveMode: 1 as 1 | 2,
  maxExclusiveAssignCount: 1 as null | number,
  teamId: undefined as number | undefined,
});

const pendingQuery = reactive({
  gradeCode: undefined as number | undefined,
  keyword: '',
  page: 1,
  pageSize: 10,
  schoolId: undefined as number | undefined,
});

const teamOptions = computed(() =>
  props.teams.map((item) => ({
    label: item.teamName,
    value: Number(item.id),
  })),
);

const selectedTeam = computed(() =>
  props.teams.find((item) => Number(item.id) === form.teamId),
);

const employeeOptions = computed(() => {
  const members = new Set(teamMemberIds.value);
  return props.employees
    .filter((item) => members.has(Number(item.id)))
    .map((item) => ({
      label: item.realName,
      value: Number(item.id),
    }));
});

const schoolOptions = computed(() =>
  props.schools.map((item) => ({
    label: item.schoolName,
    value: Number(item.id),
  })),
);

const gradeOptions = computed(() =>
  props.grades.map((item) => ({
    label: item.gradeName,
    value: Number(item.gradeCode),
  })),
);

const canGoNext = computed(() => {
  if (activeStep.value === 0)
    return !!form.teamId && form.employeeIds.length > 0;
  if (activeStep.value === 1) return form.customerIds.length > 0;
  if (activeStep.value === 3) return true;
  if (
    form.assignmentMode === 3 &&
    !form.employeeIds.some(
      (employeeId) => (form.assignmentWeights[employeeId] ?? 0) > 0,
    )
  ) {
    return false;
  }
  return form.exclusiveMode === 1 || !!form.maxExclusiveAssignCount;
});

const assignmentModeDescription = computed(() => {
  if (form.assignmentMode === 1) {
    return '平均分配：按选中客户顺序轮询员工。例如选择A、B、C时，客户依次分给A、B、C、A、B、C。';
  }
  if (form.assignmentMode === 2) {
    return '首位双权重：第一个选中的员工在轮询池中出现两次，其余员工出现一次。例如选择A、B、C时，客户依次分给A、A、B、C、A、A、B、C。';
  }
  return '偏心分配：为每个选中员工设置0-10权重，按权重生成轮询池后依次分配客户；权重0表示该员工不参与本次分配。';
});

const assignmentWeightRows = computed(() =>
  form.employeeIds.map((employeeId) => ({
    employeeId,
    employeeName: employeeName(employeeId),
    weight: form.assignmentWeights[employeeId] ?? 1,
  })),
);

const assignmentResultRows = computed(() =>
  (batchAssignResult.value?.assignments ?? []).map((item) => ({
    customerIds: customerIdPreview(item.customerIds),
    employeeId: item.employeeId,
    employeeName: employeeName(item.employeeId),
    count: item.count,
  })),
);

function syncAssignmentWeights() {
  const selected = new Set(form.employeeIds);
  for (const key of Object.keys(form.assignmentWeights)) {
    if (!selected.has(Number(key))) delete form.assignmentWeights[Number(key)];
  }
  for (const employeeId of form.employeeIds) {
    form.assignmentWeights[employeeId] ??= 1;
  }
}

function resetState() {
  activeStep.value = 0;
  form.assignmentMode = 1;
  form.assignmentWeights = {};
  form.customerIds = [...new Set(props.initialCustomerIds ?? [])];
  form.employeeIds = [];
  form.exclusiveMode = 1;
  form.maxExclusiveAssignCount = 1;
  form.teamId = undefined;
  pendingQuery.gradeCode = undefined;
  pendingQuery.keyword = '';
  pendingQuery.page = 1;
  pendingQuery.pageSize = 10;
  pendingQuery.schoolId = undefined;
  pendingRows.value = [];
  pendingTotal.value = 0;
  batchAssignResult.value = null;
  teamMemberIds.value = [];
}

function selectedIdsOnCurrentPage() {
  return new Set(form.customerIds);
}

async function syncTableSelection() {
  await nextTick();
  const table = customerTableRef.value;
  if (!table) return;
  const selected = selectedIdsOnCurrentPage();
  table.clearSelection();
  for (const row of pendingRows.value) {
    if (selected.has(Number(row.id))) table.toggleRowSelection(row, true);
  }
}

async function loadPendingCustomers() {
  if (!form.teamId) {
    pendingRows.value = [];
    pendingTotal.value = 0;
    return;
  }
  customerLoading.value = true;
  syncingCustomerSelection.value = true;
  try {
    const result = await listApi('customers', {
      gradeCode: pendingQuery.gradeCode,
      keyword: pendingQuery.keyword,
      page: pendingQuery.page,
      pageSize: pendingQuery.pageSize,
      schoolId: pendingQuery.schoolId,
      status: 1,
      teamId: form.teamId,
    });
    pendingRows.value = result.items || [];
    pendingTotal.value = result.total || 0;
    await syncTableSelection();
  } finally {
    syncingCustomerSelection.value = false;
    customerLoading.value = false;
  }
}

function syncTeamMembers() {
  form.employeeIds = [];
  form.assignmentWeights = {};
  form.customerIds = [];
  pendingQuery.page = 1;
  pendingRows.value = [];
  pendingTotal.value = 0;
  if (!form.teamId) {
    teamMemberIds.value = [];
    return;
  }
  if (Array.isArray(selectedTeam.value?.memberIds)) {
    teamMemberIds.value = selectedTeam.value.memberIds
      .map((id) => Number(id))
      .filter(Boolean);
    return;
  }
  const employeesWithTeamIds = props.employees.filter((item) =>
    Array.isArray(item.teamIds),
  );
  teamMemberIds.value = (
    employeesWithTeamIds.length ? employeesWithTeamIds : props.employees
  )
    .filter(
      (item) =>
        !Array.isArray(item.teamIds) ||
        item.teamIds.map((id) => Number(id)).includes(form.teamId!),
    )
    .map((item) => Number(item.id))
    .filter(Boolean);
}

function handleCustomerSelection(selection: Record<string, any>[]) {
  if (syncingCustomerSelection.value) return;
  const pageIds = new Set(pendingRows.value.map((row) => Number(row.id)));
  const nextIds = new Set(form.customerIds.filter((id) => !pageIds.has(id)));
  for (const row of selection) nextIds.add(Number(row.id));
  form.customerIds = [...nextIds];
}

async function searchPendingCustomers() {
  pendingQuery.page = 1;
  await loadPendingCustomers();
}

async function nextStep() {
  if (!canGoNext.value) {
    ElMessage.warning('请完善当前步骤');
    return;
  }
  if (activeStep.value === 0 && !pendingRows.value.length) {
    await loadPendingCustomers();
  }
  activeStep.value += 1;
}

function previousStep() {
  activeStep.value -= 1;
}

function employeeName(employeeId: number) {
  const employee = props.employees.find(
    (item) => Number(item.id) === employeeId,
  );
  return employee?.realName || `员工ID ${employeeId}`;
}

function customerIdPreview(customerIds: number[]) {
  const previewIds = customerIds.slice(0, 10);
  const suffix = customerIds.length > previewIds.length ? ' 等' : '';
  return `${previewIds.join('、')}${suffix}`;
}

async function submit() {
  if (!canGoNext.value || !form.teamId) {
    ElMessage.warning('请完善分配设置');
    return;
  }
  const data: BatchAssignCustomersInput = {
    assignmentMode: form.employeeIds.length > 1 ? form.assignmentMode : 1,
    assignmentWeights:
      form.assignmentMode === 3
        ? form.employeeIds.map((employeeId) => ({
            employeeId,
            weight: form.assignmentWeights[employeeId] ?? 0,
          }))
        : undefined,
    customerIds: form.customerIds,
    employeeIds: form.employeeIds,
    exclusiveMode: form.exclusiveMode,
    maxExclusiveAssignCount:
      form.exclusiveMode === 2 ? form.maxExclusiveAssignCount : null,
    teamId: form.teamId,
  };
  saving.value = true;
  try {
    const result = await batchAssignCustomersApi(data);
    batchAssignResult.value = result;
    activeStep.value = 3;
    emit('success', result.affected);
  } finally {
    saving.value = false;
  }
}

function finishResult() {
  visible.value = false;
}

watch(
  () => visible.value,
  async (value) => {
    if (!value) return;
    resetState();
    await loadPendingCustomers();
  },
);

watch(
  () => props.employees,
  () => {
    if (visible.value && form.teamId) syncTeamMembers();
  },
);

watch(
  () => [...form.employeeIds],
  () => {
    syncAssignmentWeights();
    if (form.employeeIds.length <= 1) form.assignmentMode = 1;
  },
);
</script>

<template>
  <ElDialog
    v-model="visible"
    append-to-body
    :close-on-click-modal="false"
    title="批量分配"
    width="920px"
  >
    <ElSteps :active="activeStep" finish-status="success" simple>
      <ElStep title="团队员工" />
      <ElStep title="选择客户" />
      <ElStep title="分配设置" />
      <ElStep title="分配结果" />
    </ElSteps>

    <div class="batch-assign-body">
      <ElForm v-if="activeStep === 0" :model="form" label-width="96px">
        <ElFormItem label="分配团队" required>
          <ElSelect
            v-model="form.teamId"
            clearable
            filterable
            placeholder="请选择团队"
            style="width: 100%"
            @change="syncTeamMembers"
          >
            <ElOption
              v-for="item in teamOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="团队员工" required>
          <ElSelect
            v-model="form.employeeIds"
            clearable
            collapse-tags
            filterable
            multiple
            placeholder="请选择员工"
            style="width: 100%"
          >
            <ElOption
              v-for="item in employeeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <div v-else-if="activeStep === 1" class="customer-step">
        <div class="customer-filters">
          <ElInput
            v-model="pendingQuery.keyword"
            clearable
            placeholder="关键字"
            style="width: 220px"
            @keyup.enter="searchPendingCustomers"
          />
          <ElSelect
            v-model="pendingQuery.schoolId"
            clearable
            filterable
            placeholder="学校"
            style="width: 180px"
          >
            <ElOption
              v-for="item in schoolOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
          <ElSelect
            v-model="pendingQuery.gradeCode"
            clearable
            filterable
            placeholder="年级"
            style="width: 160px"
          >
            <ElOption
              v-for="item in gradeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
          <ElButton type="primary" @click="searchPendingCustomers"
            >查询</ElButton
          >
        </div>
        <ElTable
          ref="customerTableRef"
          v-loading="customerLoading"
          :data="pendingRows"
          height="360"
          row-key="id"
          stripe
          @selection-change="handleCustomerSelection"
        >
          <ElTableColumn type="selection" width="48" />
          <ElTableColumn label="ID" prop="id" width="90" />
          <ElTableColumn label="客户姓名" min-width="120" prop="customerName" />
          <ElTableColumn label="联系电话" min-width="130" prop="phone" />
          <ElTableColumn label="学校" min-width="140" prop="schoolName" />
          <ElTableColumn label="年级" min-width="100" prop="gradeName" />
        </ElTable>
        <div class="customer-footer">
          <span>已选 {{ form.customerIds.length }} 个</span>
          <ElPagination
            v-model:current-page="pendingQuery.page"
            v-model:page-size="pendingQuery.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pendingTotal"
            background
            layout="total, sizes, prev, pager, next"
            @change="loadPendingCustomers"
          />
        </div>
      </div>

      <ElForm v-else-if="activeStep === 2" :model="form" label-width="112px">
        <ElFormItem
          v-if="form.employeeIds.length > 1"
          label="分配模式"
          required
        >
          <div class="assignment-mode-panel">
            <ElRadioGroup v-model="form.assignmentMode">
              <ElRadioButton
                v-for="item in assignmentModeOptions"
                :key="item.value"
                :label="item.value"
              >
                {{ item.label }}
              </ElRadioButton>
            </ElRadioGroup>
            <div class="assignment-mode-description">
              {{ assignmentModeDescription }}
            </div>
          </div>
        </ElFormItem>
        <ElFormItem
          v-if="form.employeeIds.length > 1 && form.assignmentMode === 3"
          label="员工权重"
          required
        >
          <div class="assignment-weight-list">
            <div
              v-for="item in assignmentWeightRows"
              :key="item.employeeId"
              class="assignment-weight-row"
            >
              <span class="assignment-weight-name">{{
                item.employeeName
              }}</span>
              <ElInputNumber
                v-model="form.assignmentWeights[item.employeeId]"
                :max="10"
                :min="0"
              />
            </div>
          </div>
        </ElFormItem>
        <ElFormItem label="分配时效" required>
          <ElRadioGroup v-model="form.exclusiveMode">
            <ElRadioButton
              v-for="item in exclusiveModeOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem v-if="form.exclusiveMode === 2" label="分配次数" required>
          <ElInputNumber
            v-model="form.maxExclusiveAssignCount"
            :min="1"
            style="width: 100%"
          />
        </ElFormItem>
      </ElForm>

      <div v-else class="assignment-result-step">
        <div class="assignment-result-icon"></div>
        <div class="assignment-result-title">分配成功</div>
        <div class="assignment-result-summary">
          共分配 {{ batchAssignResult?.affected ?? 0 }} 个客户
        </div>
        <div class="assignment-result-list">
          <div
            v-for="item in assignmentResultRows"
            :key="item.employeeId"
            class="assignment-result-row"
          >
            <div class="assignment-result-employee">
              <span class="assignment-result-name">{{
                item.employeeName
              }}</span>
              <span class="assignment-result-count"
                >{{ item.count }} 个客户</span
              >
            </div>
            <div class="assignment-result-customers">
              客户ID：{{ item.customerIds }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton v-if="activeStep === 3" type="primary" @click="finishResult"
        >完成</ElButton
      >
      <template v-else>
        <ElButton :disabled="saving" @click="visible = false">取消</ElButton>
        <ElButton v-if="activeStep > 0" :disabled="saving" @click="previousStep"
          >上一步</ElButton
        >
        <ElButton v-if="activeStep < 2" type="primary" @click="nextStep"
          >下一步</ElButton
        >
        <ElButton v-else :loading="saving" type="primary" @click="submit"
          >分配</ElButton
        >
      </template>
    </template>
  </ElDialog>
</template>

<style scoped>
.batch-assign-body {
  min-height: 440px;
  padding-top: 20px;
}

.assignment-mode-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.assignment-mode-description {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 20px;
}

.assignment-weight-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.assignment-weight-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.assignment-weight-name {
  min-width: 120px;
  color: var(--el-text-color-regular);
}

.customer-step {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.customer-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.customer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.assignment-result-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 0 12px;
}

.assignment-result-icon {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--el-color-success);
}

.assignment-result-icon::after {
  position: absolute;
  top: 16px;
  left: 23px;
  width: 16px;
  height: 28px;
  border: solid #fff;
  border-width: 0 4px 4px 0;
  content: '';
  transform: rotate(45deg);
}

.assignment-result-title {
  margin-top: 16px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.assignment-result-summary {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.assignment-result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(560px, 100%);
  margin-top: 24px;
}

.assignment-result-row {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.assignment-result-employee {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.assignment-result-name {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.assignment-result-count {
  color: var(--el-color-success);
  font-size: 13px;
}

.assignment-result-customers {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 20px;
  word-break: break-all;
}

@media (max-width: 768px) {
  .customer-footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
