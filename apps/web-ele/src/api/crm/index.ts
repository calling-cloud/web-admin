import { requestClient } from '#/api/request';

export type CrmModule =
  | 'call-records'
  | 'customers'
  | 'employees'
  | 'menus'
  | 'roles'
  | 'schools'
  | 'teams';
export type CrmOptionModule =
  | 'dicts'
  | 'employees'
  | 'menus'
  | 'roles'
  | 'schools'
  | 'teams';

export interface PageParams {
  callAtEnd?: string;
  callAtStart?: string;
  callEmployeeId?: number;
  callTeamId?: number;
  customerId?: number;
  gradeCode?: number;
  keyword?: string;
  intentLevel?: number;
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
  appLoginTtlDays?: number;
  appUpdateApkUrl?: string;
  appUpdateChangelog?: string;
  appUpdateForce?: boolean;
  appUpdateMinVersionCode?: number;
  appUpdateSha256?: string;
  appUpdateVersionCode?: number;
  appUpdateVersionName?: string;
  dealNotifyEnabled?: boolean;
  dingtalkPushEnabled?: boolean;
  dingtalkWebhookUrl?: string;
  loginCaptchaEnabled?: boolean;
  maxAssignCount?: number;
  repeatAssignContactedOnly?: boolean;
  repeatAssignIntervalHours?: number;
  repeatAssignMinIntentLevel?: number;
  wecomPushEnabled?: boolean;
  wecomWebhookUrl?: string;
}

export interface ChartQueryParams {
  endDate?: string;
  startDate?: string;
}

export interface ChartStatusRow {
  status: number;
  total: number;
}

export interface ChartRankRow {
  employeeId?: number;
  name: string;
  teamId?: number;
  total: number;
}

export interface ChartTrendRow {
  date: string;
  total: number;
}

export interface ChartStatsResult {
  callEmployeeRanks: ChartRankRow[];
  callTeamRanks: ChartRankRow[];
  callTrends: ChartTrendRow[];
  dealEmployeeRanks: ChartRankRow[];
  dealTeamRanks: ChartRankRow[];
  dealTrends: ChartTrendRow[];
  statusStats: ChartStatusRow[];
  trends: ChartTrendRow[];
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

export function captchaRequiredApi() {
  return requestClient.get<{ loginCaptchaEnabled: boolean }>(
    '/auth/captcha-required',
  );
}

export function overviewApi() {
  return requestClient.get<Record<string, any>>('/overview');
}

export function trendApi(params?: ChartQueryParams) {
  return requestClient.get<ChartStatsResult>('/overview/trend', { params });
}

export function dictsApi() {
  return requestClient.get<{ grades: DictItem[]; schoolTypes: DictItem[] }>(
    '/settings/dicts',
  );
}

export function optionsApi(modules: CrmOptionModule[]) {
  return requestClient.get<Record<string, any>>('/options', {
    params: { modules: modules.join(',') },
  });
}

export function settingsApi() {
  return requestClient.get<Record<string, any>>('/settings');
}

export function updateSettingsApi(data: SettingsInput) {
  return requestClient.put('/settings', data);
}
