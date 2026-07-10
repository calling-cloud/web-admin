import { requestClient } from '#/api/request';

export type CrmModule =
  | 'customers'
  | 'employees'
  | 'menus'
  | 'roles'
  | 'schools'
  | 'teams';

export interface PageParams {
  gradeCode?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
  schoolId?: number;
  status?: number;
  teamId?: number;
}

export interface PageResult<T = Record<string, any>> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DictItem {
  gradeCode?: number;
  gradeName?: string;
  typeCode?: number;
  typeName?: string;
}

export interface ImportCustomersResult {
  duplicatePhones: Record<string, any>[];
  imported: Record<string, any>[];
  invalidPhones: Record<string, any>[];
}

export interface SettingsInput {
  allowRepeatAssign?: boolean;
  maxAssignCount?: number;
  repeatAssignContactedOnly?: boolean;
  repeatAssignIntervalHours?: number;
  repeatAssignMinIntentLevel?: number;
}

export function listApi(module: CrmModule, params: PageParams) {
  return requestClient.get<PageResult>(`/${module}`, { params });
}

export function createApi(module: CrmModule, data: Record<string, any>) {
  return requestClient.post(`/${module}`, data);
}

export function detailApi(module: CrmModule, id: number) {
  return requestClient.get<Record<string, any>>(`/${module}/${id}`);
}

export function updateApi(
  module: CrmModule,
  id: number,
  data: Record<string, any>,
) {
  return requestClient.put(`/${module}/${id}`, data);
}

export function deleteApi(module: CrmModule, id: number) {
  return requestClient.delete(`/${module}/${id}`);
}

export function batchDeleteApi(module: CrmModule, ids: number[]) {
  return requestClient.post(`/${module}/batch/delete`, { ids });
}

export function batchStatusApi(
  module: CrmModule,
  ids: number[],
  status: number,
) {
  return requestClient.post(`/${module}/batch/status`, { ids, status });
}

export function importCustomersApi(data: FormData) {
  return requestClient.post<ImportCustomersResult>('/customers/import', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function captchaApi() {
  return requestClient.get<{ captchaId: string; image: string }>(
    '/auth/captcha',
  );
}

export function overviewApi() {
  return requestClient.get<Record<string, any>>('/overview');
}

export function trendApi() {
  return requestClient.get<Array<{ date: string; total: number }>>(
    '/overview/trend',
  );
}

export function dictsApi() {
  return requestClient.get<{ grades: DictItem[]; schoolTypes: DictItem[] }>(
    '/settings/dicts',
  );
}

export function settingsApi() {
  return requestClient.get<Record<string, any>>('/settings');
}

export function updateSettingsApi(data: SettingsInput) {
  return requestClient.put('/settings', data);
}
