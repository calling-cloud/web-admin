<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createGradeApi,
  createSchoolTypeApi,
  deleteGradeApi,
  deleteSchoolTypeApi,
  gradeListApi,
  schoolTypeListApi,
  updateGradeApi,
  updateSchoolTypeApi,
} from '#/api';

const accessStore = useAccessStore();
const userStore = useUserStore();
const types = ref<Record<string, any>[]>([]);
const grades = ref<Record<string, any>[]>([]);
const activeTypeCode = ref<number>();
const typeLoading = ref(false);
const gradeLoading = ref(false);
const saving = ref(false);
const typeVisible = ref(false);
const gradeVisible = ref(false);
const editingTypeCode = ref<number>();
const editingGradeCode = ref<number>();
const query = reactive({ keyword: '', page: 1, pageSize: 20 });
const total = ref(0);
const typeForm = reactive({
  sortOrder: 0,
  typeName: '',
});
const gradeForm = reactive({
  gradeName: '',
  sortOrder: 0,
});

const activeType = computed(() =>
  types.value.find((item) => item.typeCode === activeTypeCode.value),
);

function can(action: string) {
  return (
    userStore.userRoles.includes('admin') ||
    accessStore.accessCodes.includes(`CrmGrades:${action}`)
  );
}

function resetTypeForm(row?: Record<string, any>) {
  editingTypeCode.value = row?.typeCode;
  Object.assign(typeForm, {
    sortOrder: row?.sortOrder ?? 0,
    typeName: row?.typeName || '',
  });
}

function resetGradeForm(row?: Record<string, any>) {
  editingGradeCode.value = row?.gradeCode;
  Object.assign(gradeForm, {
    gradeName: row?.gradeName || '',
    sortOrder: row?.sortOrder ?? 0,
  });
}

async function loadTypes() {
  typeLoading.value = true;
  try {
    types.value = await schoolTypeListApi();
    if (
      !activeTypeCode.value ||
      !types.value.some((item) => item.typeCode === activeTypeCode.value)
    ) {
      activeTypeCode.value = types.value[0]?.typeCode;
    }
  } finally {
    typeLoading.value = false;
  }
}

async function loadGrades() {
  if (!activeTypeCode.value) {
    grades.value = [];
    total.value = 0;
    return;
  }
  gradeLoading.value = true;
  try {
    const result = await gradeListApi(activeTypeCode.value, query);
    grades.value = result.items || [];
    total.value = result.total || 0;
  } finally {
    gradeLoading.value = false;
  }
}

async function selectType(row: Record<string, any>) {
  activeTypeCode.value = row.typeCode;
  query.page = 1;
  await loadGrades();
}

function openCreateType() {
  resetTypeForm();
  typeVisible.value = true;
}

function openEditType(row: Record<string, any>) {
  resetTypeForm(row);
  typeVisible.value = true;
}

function openCreateGrade() {
  resetGradeForm();
  gradeVisible.value = true;
}

function openEditGrade(row: Record<string, any>) {
  resetGradeForm(row);
  gradeVisible.value = true;
}

async function saveType() {
  if (!typeForm.typeName || typeForm.sortOrder === undefined) {
    ElMessage.warning('请填写完整');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      sortOrder: typeForm.sortOrder,
      typeName: typeForm.typeName,
    };
    if (editingTypeCode.value) {
      await updateSchoolTypeApi(editingTypeCode.value, payload);
    } else {
      await createSchoolTypeApi(payload);
    }
    ElMessage.success('保存成功');
    typeVisible.value = false;
    await loadTypes();
    await loadGrades();
  } finally {
    saving.value = false;
  }
}

async function saveGrade() {
  if (!activeTypeCode.value) return;
  if (!gradeForm.gradeName || gradeForm.sortOrder === undefined) {
    ElMessage.warning('请填写完整');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      gradeName: gradeForm.gradeName,
      sortOrder: gradeForm.sortOrder,
    };
    if (editingGradeCode.value) {
      await updateGradeApi(activeTypeCode.value, editingGradeCode.value, payload);
    } else {
      await createGradeApi(activeTypeCode.value, payload);
    }
    ElMessage.success('保存成功');
    gradeVisible.value = false;
    await loadTypes();
    await loadGrades();
  } finally {
    saving.value = false;
  }
}

async function removeType(row: Record<string, any>) {
  try {
    await ElMessageBox.confirm(`确认删除“${row.typeName}”？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  await deleteSchoolTypeApi(row.typeCode);
  ElMessage.success('删除成功');
  await loadTypes();
  await loadGrades();
}

async function removeGrade(row: Record<string, any>) {
  if (!activeTypeCode.value) return;
  try {
    await ElMessageBox.confirm(`确认删除“${row.gradeName}”？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  await deleteGradeApi(activeTypeCode.value, row.gradeCode);
  ElMessage.success('删除成功');
  await loadTypes();
  await loadGrades();
}

function search() {
  query.page = 1;
  loadGrades();
}

onMounted(async () => {
  await loadTypes();
  await loadGrades();
});
</script>

<template>
  <Page title="年级管理">
    <div class="grade-layout">
      <ElCard class="type-panel" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>年级类型</span>
            <ElButton v-if="can('create')" type="primary" @click="openCreateType">新增</ElButton>
          </div>
        </template>
        <ElTable
          :data="types"
          :loading="typeLoading"
          :current-row-key="activeTypeCode"
          highlight-current-row
          row-key="typeCode"
          @row-click="selectType"
        >
          <ElTableColumn label="排序" prop="sortOrder" width="80" />
          <ElTableColumn label="年级类型" prop="typeName" />
          <ElTableColumn align="right" label="年级数" prop="gradeCount" width="80" />
          <ElTableColumn align="center" fixed="right" label="操作" width="110">
            <template #default="{ row }">
              <ElButton v-if="can('update')" link type="primary" @click.stop="openEditType(row)">
                编辑
              </ElButton>
              <ElButton v-if="can('delete')" link type="danger" @click.stop="removeType(row)">
                删除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>

      <ElCard class="grade-panel" shadow="never">
        <template #header>
          <div class="panel-header">
            <div>
              <div class="panel-title">{{ activeType?.typeName || '请选择年级类型' }}</div>
              <div class="panel-desc">管理该年级类型下的年级名称</div>
            </div>
            <ElButton
              v-if="can('create')"
              :disabled="!activeTypeCode"
              type="primary"
              @click="openCreateGrade"
            >
              新增年级
            </ElButton>
          </div>
        </template>

        <div class="toolbar">
          <ElInput
            v-model="query.keyword"
            clearable
            placeholder="搜索年级名称"
            style="width: 220px"
            @keyup.enter="search"
          />
          <ElButton @click="search">查询</ElButton>
        </div>

        <ElTable :data="grades" :loading="gradeLoading" border row-key="gradeCode">
          <ElTableColumn label="排序" prop="sortOrder" width="90" />
          <ElTableColumn label="年级名称" prop="gradeName" />
          <ElTableColumn align="center" fixed="right" label="操作" width="150">
            <template #default="{ row }">
              <ElButton v-if="can('update')" link type="primary" @click="openEditGrade(row)">
                编辑
              </ElButton>
              <ElButton v-if="can('delete')" link type="danger" @click="removeGrade(row)">
                删除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>

        <ElPagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next"
          @current-change="loadGrades"
          @size-change="search"
        />
      </ElCard>
    </div>

    <ElDialog
      v-model="typeVisible"
      :title="editingTypeCode ? '编辑年级类型' : '新增年级类型'"
      width="460px"
    >
      <ElForm :model="typeForm" label-width="110px">
        <ElFormItem label="年级类型名称" required>
          <ElInput v-model="typeForm.typeName" maxlength="20" placeholder="请输入年级类型名称" />
        </ElFormItem>
        <ElFormItem label="排序" required>
          <ElInputNumber
            v-model="typeForm.sortOrder"
            :max="255"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="typeVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="saveType">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="gradeVisible"
      :title="editingGradeCode ? '编辑年级' : '新增年级'"
      width="460px"
    >
      <ElForm :model="gradeForm" label-width="96px">
        <ElFormItem label="年级名称" required>
          <ElInput v-model="gradeForm.gradeName" maxlength="20" placeholder="请输入年级名称" />
        </ElFormItem>
        <ElFormItem label="排序" required>
          <ElInputNumber
            v-model="gradeForm.sortOrder"
            :max="255"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="gradeVisible = false">取消</ElButton>
        <ElButton :loading="saving" type="primary" @click="saveGrade">保存</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style lang="scss" scoped>
.grade-layout {
  display: grid;
  grid-template-columns: 396px minmax(0, 1fr);
  gap: 16px;
}

.type-panel,
.grade-panel {
  min-height: 560px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.panel-desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.el-pagination {
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .grade-layout {
    grid-template-columns: 1fr;
  }
}
</style>
