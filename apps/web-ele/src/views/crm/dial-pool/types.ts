import type { DialPoolFilters } from '#/api';

export interface DialPoolFilterForm
  extends Omit<DialPoolFilters, 'statusUpdatedAtEnd' | 'statusUpdatedAtStart'> {
  statusUpdatedAtRange: Date[];
}

export interface DialPoolOptions {
  employees: Array<{ id: number; realName: string }>;
  grades: Array<{ gradeCode: number; gradeName: string }>;
  schools: Array<{ gradeCodes: number[]; id: number; schoolName: string }>;
  teams: Array<{ id: number; teamName: string }>;
}

export const customerStatusOptions = [
  { label: '待分配', value: 1 },
  { label: '跟进中', value: 2 },
  { label: '已成交', value: 3 },
  { label: '无效', value: 4 },
] as const;

