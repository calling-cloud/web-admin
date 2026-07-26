<script lang="ts" setup>
import type { CrmModule, CrmOptionModule } from '#/api';
import type { FormItemRule } from 'element-plus';

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElButton,
  ElCard,
  ElCascader,
  ElCheckbox,
  ElDatePicker,
  ElDialog,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTreeSelect,
  ElUpload,
} from 'element-plus';

import {
  batchDeleteApi,
  createApi,
  deleteApi,
  detailApi,
  importCustomersApi,
  listApi,
  optionsApi,
  updateApi,
} from '#/api';

const route = useRoute();
const moduleName = computed(() => route.meta.crmModule as CrmModule);
const accessStore = useAccessStore();
const userStore = useUserStore();

const customerStatusOptions = [
  { label: '待分配', value: 1 },
  { label: '跟进中', value: 2 },
  { label: '已成交', value: 3 },
  { label: '无效', value: 4 },
];
const genderOptions = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];
const employeeStatusOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 2 },
];
const buttonActionLabels: Record<string, string> = {
  batchDelete: '批量删除',
  create: '新增',
  delete: '删除',
  detail: '详情',
  import: '导入',
  update: '编辑',
};
const buttonActionsByMenuKey: Record<string, string[]> = {
  CrmSettings: ['update'],
  CrmGrades: ['create', 'update', 'delete'],
  'call-records': ['detail'],
  customers: ['detail', 'create', 'update', 'delete', 'batchDelete', 'import'],
  employees: ['detail', 'create', 'update', 'delete', 'batchDelete'],
  menus: ['detail', 'create', 'update', 'delete', 'batchDelete'],
  roles: ['detail', 'create', 'update', 'delete', 'batchDelete'],
  schools: ['detail', 'create', 'update', 'delete', 'batchDelete'],
  teams: ['detail', 'create', 'update', 'delete', 'batchDelete'],
};
const callIntentOptions = [
  { label: '未知', value: 0 },
  { label: '基本无意向', value: 1 },
  { label: '较低', value: 2 },
  { label: '中', value: 3 },
  { label: '高', value: 4 },
  { label: '强烈', value: 5 },
];
const configs: Record<CrmModule, any> = {
  'call-records': {
    detailField: 'customerName',
    detailFields: [
      { field: 'customerName', label: '客户姓名' },
      { field: 'customerPhone', label: '联系电话' },
      { field: 'schoolName', label: '学校' },
      { field: 'gradeName', label: '年级' },
      { field: 'customerStatus', label: '客户状态', type: 'customerStatus' },
      { field: 'callEmployeeName', label: '通话员工' },
      { field: 'callTeamName', label: '所属团队' },
      { field: 'intentLevel', label: '意向度', type: 'intentLevel' },
      { field: 'callAt', label: '通话时间', type: 'date' },
      { field: 'durationSeconds', label: '时长(秒)', type: 'duration' },
      { field: 'recordingUrl', label: '通话录音', type: 'audio' },
      { field: 'remark', label: '备注' },
    ],
    editable: false,
    fields: [],
    filters: [
      'callAtRange',
      'callEmployeeId',
      'callTeamId',
      'schoolId',
      'gradeCode',
      'intentLevel',
      'status',
    ],
    title: '通话记录',
    table: [
      { field: 'customerName', label: '客户姓名' },
      { field: 'customerPhone', label: '联系电话' },
      { field: 'schoolName', label: '学校' },
      { field: 'gradeName', label: '年级' },
      { field: 'customerStatus', label: '客户状态', type: 'customerStatus' },
      { field: 'callEmployeeName', label: '通话员工' },
      { field: 'callTeamName', label: '所属团队' },
      { field: 'intentLevel', label: '意向度', type: 'intentLevel' },
      { field: 'callAt', label: '通话时间', type: 'date' },
      { field: 'durationSeconds', label: '时长(秒)', type: 'duration' },
      { field: 'recordingUrl', label: '通话录音', type: 'audio' },
      { field: 'remark', label: '备注' },
    ],
  },
  customers: {
    detailField: 'customerName',
    title: '客户管理',
    fields: [
      { field: 'customerName', label: '客户姓名', required: true },
      { field: 'phone', label: '联系电话', required: true },
      { field: 'schoolId', label: '所属学校', required: true, type: 'school' },
      { field: 'gradeCode', label: '年级', required: true, type: 'grade' },
      { field: 'assignedTeamId', label: '分配团队', type: 'team' },
      { field: 'assignedEmployeeId', label: '分配员工', type: 'employee' },
      {
        field: 'status',
        label: '状态',
        options: customerStatusOptions,
        type: 'select',
      },
      { field: 'dealAt', label: '成交时间', type: 'datetime' },
      { field: 'remark', label: '备注', type: 'textarea' },
    ],
    filters: ['status', 'schoolId', 'gradeCode'],
    table: [
      { field: 'customerName', label: '客户姓名' },
      { field: 'phone', label: '联系电话' },
      { field: 'schoolName', label: '所属学校' },
      { field: 'gradeName', label: '年级' },
      { field: 'assignedCount', label: '分配次数' },
      { field: 'status', label: '状态', type: 'customerStatus' },
      { field: 'updatedAt', label: '更新时间', type: 'date' },
    ],
  },
  employees: {
    detailField: 'realName',
    detailFields: [
      { field: 'username', label: '登录用户名' },
      { field: 'realName', label: '员工姓名' },
      { field: 'phone', label: '手机号' },
      {
        field: 'gender',
        label: '性别',
        options: genderOptions,
        type: 'select',
      },
      { field: 'roleId', label: '系统角色', type: 'role' },
      { field: 'isAdmin', label: '后台登录', type: 'bool' },
      { field: 'status', label: '状态', type: 'employeeStatus' },
      { field: 'teams', label: '所在团队', type: 'tags' },
      { field: 'avatarUrl', label: '头像URL' },
      { field: 'lastLoginAt', label: '最后登录', type: 'date' },
    ],
    title: '员工管理',
    fields: [
      { field: 'username', label: '登录用户名', required: true },
      {
        field: 'password',
        label: '登录密码',
        required: true,
        type: 'password',
      },
      { field: 'realName', label: '员工姓名', required: true },
      { field: 'phone', label: '手机号', required: true },
      {
        field: 'gender',
        label: '性别',
        options: genderOptions,
        type: 'select',
      },
      { field: 'roleId', label: '系统角色', type: 'role' },
      { field: 'isAdmin', label: '后台登录', type: 'switch' },
      {
        defaultValue: 1,
        field: 'status',
        label: '状态',
        options: employeeStatusOptions,
        type: 'radio',
      },
      { field: 'avatarUrl', label: '头像URL' },
    ],
    filters: ['teamId'],
    table: [
      { field: 'username', label: '用户名' },
      { field: 'realName', label: '姓名' },
      { field: 'phone', label: '手机号' },
      { field: 'roleName', label: '角色' },
      { field: 'isAdmin', label: '后台登录', type: 'bool' },
      { field: 'status', label: '状态', type: 'employeeStatus' },
      { field: 'lastLoginAt', label: '最后登录', type: 'date' },
    ],
  },
  menus: {
    detailField: 'title',
    title: '菜单管理',
    fields: [
      { field: 'parentId', label: '上级菜单', type: 'menu' },
      { field: 'title', label: '菜单标题', required: true },
      { field: 'routeName', label: '路由名称', required: true },
      { field: 'path', label: '路由路径', required: true },
      { field: 'component', label: '组件路径' },
      { field: 'icon', label: '图标' },
      { field: 'moduleKey', label: '模块标识' },
      { field: 'sortOrder', label: '排序', type: 'number' },
    ],
    filters: [],
    table: [
      { field: 'title', label: '菜单标题' },
      { field: 'parentTitle', label: '上级菜单' },
      { field: 'routeName', label: '路由名称' },
      { field: 'path', label: '路径' },
      { field: 'component', label: '组件' },
      { field: 'moduleKey', label: '模块' },
      { field: 'sortOrder', label: '排序' },
    ],
  },
  roles: {
    detailField: 'roleName',
    detailFields: [
      { field: 'roleCode', label: '角色编码' },
      { field: 'roleName', label: '角色名称' },
    ],
    title: '角色管理',
    fields: [
      { field: 'roleCode', label: '角色编码', required: true },
      { field: 'roleName', label: '角色名称', required: true },
      { field: 'menuIds', label: '可见菜单', multiple: true, type: 'menu' },
      {
        field: 'buttonCodes',
        label: '按钮权限',
        multiple: true,
        type: 'buttons',
      },
    ],
    filters: [],
    table: [
      { field: 'roleCode', label: '角色编码' },
      { field: 'roleName', label: '角色名称' },
      { field: 'menuCount', label: '菜单数' },
      { field: 'buttonCount', label: '按钮数' },
      { field: 'updatedAt', label: '更新时间', type: 'date' },
    ],
  },
  schools: {
    detailField: 'schoolName',
    title: '学校管理',
    fields: [
      { field: 'schoolName', label: '学校名称', required: true },
      {
        field: 'typeCodes',
        label: '学校类型',
        multiple: true,
        required: true,
        type: 'schoolType',
      },
      {
        field: 'gradeCodes',
        label: '可用年级',
        multiple: true,
        required: true,
        type: 'grade',
      },
    ],
    filters: [],
    table: [
      { field: 'schoolName', label: '学校名称' },
      { field: 'customerCount', label: '客户数' },
      { field: 'updatedAt', label: '更新时间', type: 'date' },
    ],
  },
  teams: {
    detailField: 'teamName',
    title: '团队管理',
    fields: [
      { field: 'teamName', label: '团队名称', required: true },
      {
        field: 'memberIds',
        label: '团队成员',
        multiple: true,
        type: 'employee',
      },
      { field: 'leaderIds', label: '负责人', multiple: true, type: 'employee' },
      { field: 'scopes', label: '客户权限', type: 'scopes' },
    ],
    filters: [],
    table: [
      { field: 'teamName', label: '团队名称' },
      { field: 'memberCount', label: '成员数量' },
      { field: 'leaders', label: '负责人', type: 'tags' },
      { field: 'updatedAt', label: '更新时间', type: 'date' },
    ],
  },
};

const config = computed(() => configs[moduleName.value]);
const auxModulesByModule: Record<CrmModule, CrmOptionModule[]> = {
  'call-records': ['dicts', 'schools', 'employees', 'teams'],
  customers: ['dicts', 'schools', 'teams', 'employees'],
  employees: ['teams', 'roles'],
  menus: ['menus'],
  roles: ['menus'],
  schools: ['dicts'],
  teams: ['dicts', 'schools', 'employees'],
};
const batchModules = new Set<CrmModule>([
  'customers',
  'employees',
  'menus',
  'roles',
  'schools',
  'teams',
]);
const readOnly = computed(() => config.value.editable === false);
const canBatch = computed(() => batchModules.has(moduleName.value));
const currentMenuKey = computed(
  () =>
    menuKey(
      dicts.menus.find((item) => item.moduleKey === moduleName.value),
    ) || moduleName.value,
);
const canBulkAction = computed(
  () => !readOnly.value && canBatch.value && hasButton('batchDelete'),
);
const canOperate = computed(
  () => !readOnly.value && (hasButton('update') || hasButton('delete')),
);
const audioUrl = ref('');
const audioVisible = ref(false);
const drawerMode = ref<'create' | 'detail' | 'edit'>('create');
const dialogVisible = ref(false);
const formLoading = ref(false);
const formSaving = ref(false);
const importVisible = ref(false);
const editingId = ref<number>();
const loading = ref(false);
const rows = ref<Record<string, any>[]>([]);
const selectedRows = ref<Record<string, any>[]>([]);
const total = ref(0);
const fileList = ref<any[]>([]);
const formRef = ref();
const teamScopesTouched = ref(false);
const form = reactive<Record<string, any>>({});
const importForm = reactive({
  autoDeduplicatePhone: true,
  autoValidatePhone: true,
  gradeCode: undefined,
  schoolId: undefined,
});
const selectedIds = computed(() =>
  selectedRows.value.map((row) => Number(row.id)).filter(Boolean),
);
const detailMode = computed(() => drawerMode.value === 'detail');
const drawerFields = computed(() =>
  detailMode.value
    ? (config.value.detailFields ?? config.value.fields)
    : config.value.fields,
);
const drawerTitle = computed(() =>
  detailMode.value ? '详情' : editingId.value ? '编辑' : '新增',
);
const query = reactive<Record<string, any>>({
  callEmployeeId: undefined,
  callTeamId: undefined,
  callAtRange: [],
  intentLevel: undefined,
  keyword: '',
  page: 1,
  pageSize: 20,
});
const dicts = reactive({
  employees: [] as Record<string, any>[],
  grades: [] as Record<string, any>[],
  menus: [] as Record<string, any>[],
  roles: [] as Record<string, any>[],
  schools: [] as Record<string, any>[],
  schoolTypes: [] as Record<string, any>[],
  teams: [] as Record<string, any>[],
});

function resetQuery() {
  Object.assign(query, {
    callAtRange: [],
    callEmployeeId: undefined,
    callTeamId: undefined,
    gradeCode: undefined,
    intentLevel: undefined,
    keyword: '',
    page: 1,
    schoolId: undefined,
    status: undefined,
    teamId: undefined,
  });
}

function labelOf(
  options: readonly { label: string; value: number }[],
  value: any,
) {
  return (
    options.find((item) => item.value === Number(value))?.label || value || '-'
  );
}

function fmt(value: any, type?: string) {
  if (value === undefined || value === null || value === '') return '-';
  if (type === 'customerStatus') return labelOf(customerStatusOptions, value);
  if (type === 'duration') return `${value} 秒`;
  if (type === 'employeeStatus') return labelOf(employeeStatusOptions, value);
  if (type === 'intentLevel') return labelOf(callIntentOptions, value);
  if (type === 'bool') return value ? '是' : '否';
  if (type === 'date') return new Date(value).toLocaleString();
  return value;
}

function openAudio(url: string) {
  audioUrl.value = url;
  audioVisible.value = true;
}

function selectOptions(field: any): Array<{ label: string; value: any }> {
  if (field.options) return field.options;
  if (field.type === 'grade') {
    return dicts.grades.map((item) => ({
      label: item.gradeName,
      value: item.gradeCode,
    }));
  }
  if (field.type === 'schoolType') {
    return dicts.schoolTypes.map((item) => ({
      label: item.typeName,
      value: item.typeCode,
    }));
  }
  if (field.type === 'school') {
    return dicts.schools.map((item) => ({
      label: item.schoolName,
      value: item.id,
    }));
  }
  if (field.type === 'team') {
    return dicts.teams.map((item) => ({
      label: item.teamName,
      value: item.id,
    }));
  }
  if (field.type === 'role') {
    return dicts.roles.map((item) => ({
      label: item.roleName,
      value: item.id,
    }));
  }
  if (field.type === 'intentLevel') {
    return callIntentOptions;
  }
  if (field.type === 'employee') {
    return dicts.employees.map((item) => ({
      label: item.realName,
      value: item.id,
    }));
  }
  return [];
}

function optionLabel(field: any, value: any) {
  if (field.type === 'menu') {
    return (
      dicts.menus.find((item) => String(item.id) === String(value))?.title ??
      value
    );
  }
  return (
    selectOptions(field).find((item) => item.value === value)?.label ??
    selectOptions(field).find((item) => String(item.value) === String(value))
      ?.label ??
    value
  );
}

function detailText(field: any) {
  const value = form[field.field];
  if (value === undefined || value === null || value === '') return '-';
  if (field.type === 'scopes') {
    return Array.isArray(value) && value.length
      ? value
          .map((item) => {
            const schoolName = optionLabel(
              { type: 'school' },
              item.schoolId,
            );
            const gradeName = optionLabel({ type: 'grade' }, item.gradeCode);
            return `${schoolName} / ${gradeName}`;
          })
          .join('、')
      : '-';
  }
  if (field.type === 'tags') {
    return Array.isArray(value) && value.length
      ? value
          .map(
            (item) =>
              item.teamName || item.realName || item.name || item.label || item,
          )
          .join('、')
      : '-';
  }
  if (Array.isArray(value)) {
    return value.length
      ? value.map((item) => optionLabel(field, item)).join('、')
      : '-';
  }
  if (
    field.type === 'employee' ||
    field.type === 'grade' ||
    field.type === 'menu' ||
    field.type === 'role' ||
    field.type === 'school' ||
    field.type === 'schoolType' ||
    field.type === 'team'
  ) {
    return optionLabel(field, value);
  }
  if (field.type === 'datetime') return fmt(value, 'date');
  if (field.type === 'select' && field.options) {
    return labelOf(field.options, value);
  }
  return fmt(value, field.type);
}

function menuTreeOptions(disableId?: number) {
  const nodes = new Map<number, Record<string, any>>();
  const roots: Record<string, any>[] = [];
  for (const item of dicts.menus) {
    nodes.set(item.id, {
      children: [],
      disabled: item.id === disableId,
      label: item.title,
      value: item.id,
    });
  }
  for (const item of dicts.menus) {
    const node = nodes.get(item.id)!;
    if (item.parentId && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const disableChildren = (node?: Record<string, any>) => {
    if (!node) return;
    node.disabled = true;
    for (const child of node.children) disableChildren(child);
  };
  disableChildren(disableId ? nodes.get(disableId) : undefined);
  return roots;
}

function menuKey(item?: Record<string, any>) {
  return item ? item.moduleKey || item.routeName : '';
}

function hasButton(action: string) {
  return (
    userStore.userRoles.includes('admin') ||
    accessStore.accessCodes.includes(`${currentMenuKey.value}:${action}`)
  );
}

function buttonTreeOptions() {
  const nodes: Record<string, any>[] = [];
  for (const item of dicts.menus) {
    const actions = buttonActionsByMenuKey[menuKey(item)] || [];
    if (!actions.length) continue;
    nodes.push({
      children: actions.map((code) => ({
        label: buttonActionLabels[code] || code,
        value: `${item.id}:${code}`,
      })),
      disabled: true,
      label: item.title,
      value: `menu:${item.id}`,
    });
  }
  return nodes;
}

function fieldRules(field: any): FormItemRule[] | undefined {
  if (
    !field.required ||
    (moduleName.value === 'employees' &&
      editingId.value &&
      field.field === 'password')
  ) {
    return undefined;
  }
  const rule: FormItemRule = {
    message: `${field.label}必填`,
    required: true,
    trigger:
      field.type === 'select' ||
      field.type === 'school' ||
      field.type === 'schoolType' ||
      field.type === 'grade' ||
      field.type === 'team' ||
      field.type === 'role' ||
      field.type === 'employee' ||
      field.type === 'menu' ||
      field.type === 'radio' ||
      field.type === 'buttons'
        ? 'change'
        : 'blur',
  };
  if (field.multiple) rule.type = 'array';
  return [rule];
}

function buildMenuTree(items: Record<string, any>[]) {
  const nodes = new Map<number, Record<string, any>>();
  const roots: Record<string, any>[] = [];
  for (const item of items) nodes.set(item.id, { ...item, children: [] });
  for (const item of items) {
    const node = nodes.get(item.id)!;
    if (item.parentId && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

const scopeCascaderProps = { multiple: true };

const schoolScopeOptions = computed(() =>
  dicts.schools.map((school) => {
    const gradeCodes =
      Array.isArray(school.gradeCodes) && school.gradeCodes.length > 0
        ? school.gradeCodes
        : dicts.grades.map((grade) => grade.gradeCode);

    return {
      children: dicts.grades
        .filter((grade) => gradeCodes.includes(grade.gradeCode))
        .map((grade) => ({
          label: grade.gradeName,
          value: grade.gradeCode,
        })),
      label: school.schoolName,
      value: school.id,
    };
  }),
);

const scopeValue = computed({
  get() {
    return (form.scopes || [])
      .filter((item: Record<string, any>) => item.schoolId && item.gradeCode)
      .map((item: Record<string, any>) => [item.schoolId, item.gradeCode]);
  },
  set(value: number[][] = []) {
    teamScopesTouched.value = true;
    form.scopes = value.map(([schoolId, gradeCode]) => ({
      gradeCode,
      schoolId,
    }));
  },
});

async function loadAuxData() {
  const result = await optionsApi(auxModulesByModule[moduleName.value]);
  if (result.dicts) {
    dicts.grades = result.dicts.grades || [];
    dicts.schoolTypes = result.dicts.schoolTypes || [];
  }
  if (result.schools) dicts.schools = result.schools || [];
  if (result.teams) dicts.teams = result.teams || [];
  if (result.employees) dicts.employees = result.employees || [];
  if (result.roles) dicts.roles = result.roles || [];
  if (result.menus) dicts.menus = result.menus || [];
}

async function loadData() {
  loading.value = true;
  try {
    const result = await listApi(
      moduleName.value,
      moduleName.value === 'menus'
        ? {
            ...query,
            page: 1,
            pageSize: 100,
          }
        : moduleName.value === 'call-records'
          ? {
              ...query,
              callAtRange: undefined,
              callAtEnd: query.callAtRange?.[1],
              callAtStart: query.callAtRange?.[0],
            }
          : query,
    );
    rows.value =
      moduleName.value === 'menus'
        ? buildMenuTree(result.items || [])
        : result.items || [];
    total.value = result.total || 0;
  } catch (error) {
    if (handleCustomerScopeForbidden(error)) {
      rows.value = [];
      total.value = 0;
      return;
    }
    throw error;
  } finally {
    loading.value = false;
  }
}

function customerScopeForbidden(error: any) {
  const message =
    error?.error ??
    error?.message ??
    error?.response?.data?.error ??
    error?.response?.data?.message;
  return message === '无权访问该学校年级客户';
}

function handleCustomerScopeForbidden(error: any) {
  if (moduleName.value !== 'customers' || !customerScopeForbidden(error)) {
    return false;
  }
  ElMessage.warning('暂无该学校年级客户权限');
  return true;
}

async function resetForm(row?: Record<string, any>) {
  editingId.value = row?.id;
  teamScopesTouched.value = false;
  Object.keys(form).forEach((key) => delete form[key]);
  const data =
    (detailMode.value ||
      moduleName.value === 'schools' ||
      moduleName.value === 'teams' ||
      moduleName.value === 'roles') &&
    row?.id
      ? await detailApi(moduleName.value, row.id)
      : row;
  for (const field of drawerFields.value) {
    const value = data?.[field.field];
    if (field.type === 'switch') {
      if ('activeValue' in field || 'inactiveValue' in field) {
        form[field.field] = value ?? field.activeValue;
        continue;
      }
      form[field.field] = value === true || value === 1 || value === '1';
      continue;
    }
    form[field.field] =
      value ??
      field.defaultValue ??
      (field.multiple || field.type === 'scopes'
        ? []
        : undefined);
  }
  if (moduleName.value === 'employees' && row) {
    form.password = undefined;
  }
}

async function openDialog(row?: Record<string, any>) {
  drawerMode.value = row ? 'edit' : 'create';
  editingId.value = row?.id;
  dialogVisible.value = true;
  formLoading.value = true;
  await nextTick();
  try {
    await resetForm(row);
  } catch (error) {
    dialogVisible.value = false;
    throw error;
  } finally {
    formLoading.value = false;
  }
}

async function openDetail(row: Record<string, any>) {
  if (!row?.id || !hasButton('detail')) return;
  drawerMode.value = 'detail';
  editingId.value = row.id;
  dialogVisible.value = true;
  formLoading.value = true;
  await nextTick();
  try {
    await resetForm(row);
  } catch (error) {
    dialogVisible.value = false;
    throw error;
  } finally {
    formLoading.value = false;
  }
}

function payload() {
  const data = Object.fromEntries(
    Object.entries(form).filter(
      ([, value]) => value !== '' && value !== undefined,
    ),
  );
  if (moduleName.value === 'employees' && editingId.value && !data.password) {
    delete data.password;
  }
  if (
    moduleName.value === 'teams' &&
    editingId.value &&
    !teamScopesTouched.value
  ) {
    delete data.scopes;
  }
  if (
    moduleName.value === 'menus' &&
    editingId.value &&
    form.parentId === undefined
  ) {
    data.parentId = null;
  }
  if (
    moduleName.value === 'roles' &&
    Array.isArray(data.buttonCodes) &&
    Array.isArray(data.menuIds)
  ) {
    const menuIds = new Set(data.menuIds.map(Number));
    data.buttonCodes = data.buttonCodes.filter((code: string) =>
      menuIds.has(Number(code.split(':')[0])),
    );
  }
  return data;
}

async function save() {
  if (formLoading.value || formSaving.value) return;
  await formRef.value?.validate();
  formSaving.value = true;
  try {
    if (editingId.value) {
      await updateApi(moduleName.value, editingId.value, payload());
    } else {
      await createApi(moduleName.value, payload());
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await Promise.all([loadAuxData(), loadData()]);
  } catch (error) {
    if (handleCustomerScopeForbidden(error)) return;
    throw error;
  } finally {
    formSaving.value = false;
  }
}

async function remove(row: Record<string, any>) {
  await ElMessageBox.confirm('确认删除这条数据？', '提示', { type: 'warning' });
  try {
    await deleteApi(moduleName.value, row.id);
  } catch (error) {
    if (handleCustomerScopeForbidden(error)) return;
    throw error;
  }
  ElMessage.success('删除成功');
  await Promise.all([loadAuxData(), loadData()]);
}

async function batchRemove() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先勾选数据');
    return;
  }
  await ElMessageBox.confirm(
    `确认删除选中的${selectedIds.value.length}条数据？`,
    '提示',
    { type: 'warning' },
  );
  await batchDeleteApi(moduleName.value, selectedIds.value);
  ElMessage.success(`已删除${selectedIds.value.length}条`);
  selectedRows.value = [];
  await Promise.all([loadAuxData(), loadData()]);
}

function openImport() {
  importForm.autoDeduplicatePhone = true;
  importForm.autoValidatePhone = true;
  importVisible.value = true;
}

async function submitImport() {
  const file = fileList.value[0]?.raw;
  if (!file || !importForm.schoolId || !importForm.gradeCode) {
    ElMessage.warning('请选择文件、学校和年级');
    return;
  }
  const data = new FormData();
  data.append('file', file);
  data.append('schoolId', String(importForm.schoolId));
  data.append('gradeCode', String(importForm.gradeCode));
  data.append('autoDeduplicatePhone', String(importForm.autoDeduplicatePhone));
  data.append('autoValidatePhone', String(importForm.autoValidatePhone));
  let result;
  try {
    result = await importCustomersApi(data);
  } catch (error) {
    if (handleCustomerScopeForbidden(error)) return;
    throw error;
  }
  ElMessage.success(
    `导入成功：成功${result.imported.length}条，重复手机号${result.duplicatePhones.length}条，非法手机号${result.invalidPhones.length}条`,
  );
  importVisible.value = false;
  fileList.value = [];
  await loadData();
}

async function resetSearch() {
  resetQuery();
  await loadData();
}

watch(
  () => moduleName.value,
  async () => {
    resetQuery();
    selectedRows.value = [];
    await Promise.all([loadAuxData(), loadData()]);
  },
);

onMounted(async () => {
  await Promise.all([loadAuxData(), loadData()]);
});
</script>

<template>
  <Page
    :title="config.title"
    auto-content-height
    content-class="crm-list-content"
  >
    <ElCard class="crm-search-card">
      <div class="flex flex-wrap items-center gap-3">
        <ElInput
          v-model="query.keyword"
          clearable
          placeholder="关键字"
          style="width: 220px"
          @keyup.enter="loadData"
        />
        <ElSelect
          v-if="config.filters.includes('status')"
          v-model="query.status"
          clearable
          placeholder="状态"
          style="width: 140px"
        >
          <ElOption
            v-for="item in customerStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-if="config.filters.includes('schoolId')"
          v-model="query.schoolId"
          clearable
          filterable
          placeholder="学校"
          style="width: 180px"
        >
          <ElOption
            v-for="item in selectOptions({ type: 'school' })"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-if="config.filters.includes('gradeCode')"
          v-model="query.gradeCode"
          clearable
          filterable
          placeholder="年级"
          style="width: 160px"
        >
          <ElOption
            v-for="item in selectOptions({ type: 'grade' })"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-if="config.filters.includes('teamId')"
          v-model="query.teamId"
          clearable
          filterable
          placeholder="团队"
          style="width: 160px"
        >
          <ElOption
            v-for="item in selectOptions({ type: 'team' })"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-if="config.filters.includes('callEmployeeId')"
          v-model="query.callEmployeeId"
          clearable
          filterable
          placeholder="通话员工"
          style="width: 160px"
        >
          <ElOption
            v-for="item in selectOptions({ type: 'employee' })"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElDatePicker
          v-if="config.filters.includes('callAtRange')"
          v-model="query.callAtRange"
          end-placeholder="结束时间"
          range-separator="至"
          start-placeholder="开始时间"
          style="width: 340px"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
        <ElSelect
          v-if="config.filters.includes('callTeamId')"
          v-model="query.callTeamId"
          clearable
          filterable
          placeholder="通话团队"
          style="width: 160px"
        >
          <ElOption
            v-for="item in selectOptions({ type: 'team' })"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-if="config.filters.includes('intentLevel')"
          v-model="query.intentLevel"
          clearable
          placeholder="意向度"
          style="width: 140px"
        >
          <ElOption
            v-for="item in callIntentOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElButton type="primary" @click="loadData">查询</ElButton>
        <ElButton @click="resetSearch">重置</ElButton>
      </div>
    </ElCard>

    <ElCard class="crm-table-card">
      <div class="crm-table-toolbar">
        <div class="flex flex-wrap items-center gap-2">
          <ElButton
            v-if="canBulkAction"
            :disabled="!selectedIds.length"
            type="danger"
            @click="batchRemove"
          >
            批量删除
          </ElButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <ElButton v-if="!readOnly && hasButton('create')" @click="openDialog()">
            新增
          </ElButton>
          <ElButton
            v-if="!readOnly && moduleName === 'customers' && hasButton('import')"
            @click="openImport"
          >
            导入
          </ElButton>
        </div>
      </div>
      <ElTable
        v-loading="loading"
        :data="rows"
        height="100%"
        row-key="id"
        stripe
        :tree-props="{ children: 'children' }"
        @selection-change="selectedRows = $event"
      >
        <ElTableColumn v-if="canBulkAction" type="selection" width="48" />
        <ElTableColumn label="ID" prop="id" width="90" />
        <ElTableColumn
          v-for="column in config.table"
          :key="column.field"
          :label="column.label"
          min-width="120"
        >
          <template #default="{ row }">
            <ElButton
              v-if="
                column.field === config.detailField &&
                row[column.field] &&
                hasButton('detail')
              "
              link
              type="primary"
              @click="openDetail(row)"
            >
              {{ fmt(row[column.field], column.type) }}
            </ElButton>
            <div v-else-if="column.type === 'tags'" class="flex flex-wrap gap-1">
              <ElTag
                v-for="item in row[column.field] || []"
                :key="item.id || item.realName"
                size="small"
              >
                {{ item.realName || item.name || item.label || item }}
              </ElTag>
            </div>
            <a
              v-else-if="column.type === 'link' && row[column.field]"
              :href="row[column.field]"
              rel="noreferrer"
              target="_blank"
            >
              查看
            </a>
            <div
              v-else-if="column.type === 'audio' && row[column.field]"
              class="crm-audio-cell"
            >
              <ElButton link type="primary" @click="openAudio(row[column.field])">
                查看
              </ElButton>
            </div>
            <span v-else>{{ fmt(row[column.field], column.type) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn v-if="canOperate" fixed="right" label="操作" width="150">
          <template #default="{ row }">
            <ElButton
              v-if="hasButton('update')"
              link
              type="primary"
              @click="openDialog(row)"
              >编辑</ElButton
            >
            <ElButton
              v-if="hasButton('delete')"
              link
              type="danger"
              @click="remove(row)"
              >删除</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-if="moduleName !== 'menus'" class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next"
          @change="loadData"
        />
      </div>
    </ElCard>

    <ElDrawer
      v-if="!readOnly || detailMode"
      v-model="dialogVisible"
      direction="rtl"
      size="560px"
      :title="drawerTitle"
    >
      <div v-if="formLoading" v-loading="true" style="min-height: 240px"></div>
      <ElForm
        v-else
        ref="formRef"
        v-loading="formSaving"
        :model="form"
        label-width="110px"
      >
        <ElFormItem
          v-for="field in drawerFields"
          :key="field.field"
          :label="field.label"
          :prop="field.field"
          :rules="detailMode ? undefined : fieldRules(field)"
        >
          <ElButton
            v-if="detailMode && field.type === 'audio' && form[field.field]"
            link
            type="primary"
            @click="openAudio(form[field.field])"
          >
            查看
          </ElButton>
          <span v-else-if="detailMode" class="crm-detail-value">
            {{ detailText(field) }}
          </span>
          <ElTreeSelect
            v-else-if="field.type === 'buttons'"
            v-model="form[field.field]"
            clearable
            collapse-tags
            :data="buttonTreeOptions()"
            filterable
            :multiple="field.multiple"
            node-key="value"
            :show-checkbox="field.multiple"
            style="width: 100%"
          />
          <ElTreeSelect
            v-else-if="field.type === 'menu'"
            v-model="form[field.field]"
            check-strictly
            clearable
            collapse-tags
            :data="
              menuTreeOptions(moduleName === 'menus' ? editingId : undefined)
            "
            filterable
            :multiple="field.multiple"
            node-key="value"
            :show-checkbox="field.multiple"
            style="width: 100%"
          />
          <ElSelect
            v-else-if="
              field.type === 'select' ||
              field.type === 'school' ||
              field.type === 'schoolType' ||
              field.type === 'grade' ||
              field.type === 'team' ||
              field.type === 'role' ||
              field.type === 'employee'
            "
            v-model="form[field.field]"
            :multiple="field.multiple"
            clearable
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="item in selectOptions(field)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
          <ElRadioGroup
            v-else-if="field.type === 'radio'"
            v-model="form[field.field]"
          >
            <ElRadioButton
              v-for="item in selectOptions(field)"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </ElRadioButton>
          </ElRadioGroup>
          <ElSwitch
            v-else-if="field.type === 'switch'"
            v-model="form[field.field]"
            :active-text="field.activeText"
            :active-value="field.activeValue ?? true"
            :inactive-text="field.inactiveText"
            :inactive-value="field.inactiveValue ?? false"
          />
          <ElInputNumber
            v-else-if="field.type === 'number'"
            v-model="form[field.field]"
            style="width: 100%"
          />
          <ElCascader
            v-else-if="field.type === 'scopes'"
            v-model="scopeValue"
            :options="schoolScopeOptions"
            :props="scopeCascaderProps"
            clearable
            collapse-tags
            filterable
            placeholder="请选择学校和年级"
            style="width: 100%"
          />
          <ElDatePicker
            v-else-if="field.type === 'datetime'"
            v-model="form[field.field]"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
          <ElInput
            v-else-if="field.type === 'textarea'"
            v-model="form[field.field]"
            :rows="3"
            type="textarea"
          />
          <ElInput
            v-else
            v-model="form[field.field]"
            :disabled="
              moduleName === 'roles' &&
              form.roleCode === 'admin' &&
              (field.field === 'roleCode' || field.field === 'roleName')
            "
            :show-password="field.type === 'password'"
            :type="field.type === 'password' ? 'password' : 'text'"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton :disabled="formSaving" @click="dialogVisible = false">
          {{ detailMode ? '关闭' : '取消' }}
        </ElButton>
        <ElButton
          v-if="!detailMode && hasButton(editingId ? 'update' : 'create')"
          :disabled="formLoading || formSaving"
          :loading="formSaving"
          type="primary"
          @click="save"
          >保存</ElButton
        >
      </template>
    </ElDrawer>

    <ElDialog
      v-model="audioVisible"
      title="通话录音"
      width="520px"
      @closed="audioUrl = ''"
    >
      <audio
        v-if="audioUrl"
        class="crm-audio-player"
        :src="audioUrl"
        controls
        preload="none"
      ></audio>
    </ElDialog>

    <ElDialog v-if="!readOnly" v-model="importVisible" title="导入客户" width="520px">
      <ElForm :model="importForm" label-width="90px">
        <ElFormItem label="学校" required>
          <ElSelect
            v-model="importForm.schoolId"
            filterable
            placeholder="请选择学校"
            style="width: 100%"
          >
            <ElOption
              v-for="item in selectOptions({ type: 'school' })"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="年级" required>
          <ElSelect
            v-model="importForm.gradeCode"
            filterable
            placeholder="请选择年级"
            style="width: 100%"
          >
            <ElOption
              v-for="item in selectOptions({ type: 'grade' })"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="文件">
          <ElUpload
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls,.csv"
          >
            <ElButton>选择文件</ElButton>
          </ElUpload>
        </ElFormItem>
        <ElFormItem label="选项">
          <div class="flex flex-col gap-2">
            <ElCheckbox v-model="importForm.autoDeduplicatePhone">
              自动去重手机号
            </ElCheckbox>
            <ElCheckbox v-model="importForm.autoValidatePhone">
              自动校验手机号有效性
            </ElCheckbox>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="importVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitImport">导入</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
:deep(.crm-list-content) {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.crm-search-card {
  position: sticky;
  top: 0;
  z-index: 5;
  flex: none;
}

.crm-table-card {
  flex: 1;
  min-height: 0;
}

.crm-table-card :deep(.el-card__body) {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
}

.crm-table-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
}

.crm-table-card :deep(.el-table) {
  flex: 1;
  min-height: 0;
}

.crm-audio-cell {
  display: flex;
  align-items: center;
}

.crm-audio-player {
  width: 100%;
}

.crm-detail-value {
  word-break: break-word;
}

@media (max-width: 768px) {
  .crm-table-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
