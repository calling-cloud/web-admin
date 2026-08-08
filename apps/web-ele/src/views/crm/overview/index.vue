<script lang="ts" setup>
import type { Component } from 'vue';

import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Page, VbenCountToAnimator } from '@vben/common-ui';
import {
  IconifyIcon,
  SvgBangDingIcon,
  SvgCakeIcon,
  SvgGouTongIcon,
  SvgJiangBeiIcon,
  SvgKeHuZongShuIcon,
  SvgSchoolIcon,
  SvgTeamIcon,
  SvgYuanGongIcon,
} from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElButton, ElCard, ElDatePicker, ElDialog, ElMessage } from 'element-plus';

import { overviewApi, trendApi } from '#/api';

type DateRange = [string, string];
type ChartStatusRow = { status: number; total: number };
type ChartTrendRow = { date: string; total: number };
type ChartRankRow = {
  employeeId?: number;
  name: string;
  teamId?: number;
  total: number;
};
type ChartData = {
  callEmployeeRanks: ChartRankRow[];
  callTeamRanks: ChartRankRow[];
  callTrends: ChartTrendRow[];
  dealEmployeeRanks: ChartRankRow[];
  dealTeamRanks: ChartRankRow[];
  dealTrends: ChartTrendRow[];
  statusStats: ChartStatusRow[];
  trends: ChartTrendRow[];
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const QUICK_RANGES = [7, 15, 30] as const;
const MAX_RANGE_DAYS = 31;

const overviewStats = ref<Record<string, any>>({});
const chartStats = ref<ChartData>({
  callEmployeeRanks: [],
  callTeamRanks: [],
  callTrends: [],
  dealEmployeeRanks: [],
  dealTeamRanks: [],
  dealTrends: [],
  statusStats: [],
  trends: [],
});
const chartLoading = ref(false);
const filterVisible = ref(false);
const draftRange = ref<DateRange>(createRange(7));
const appliedRange = ref<DateRange>(createRange(7));

const statusChartRef = ref<EchartsUIType>();
const customerTrendChartRef = ref<EchartsUIType>();
const dealEmployeeChartRef = ref<EchartsUIType>();
const dealTeamChartRef = ref<EchartsUIType>();
const callEmployeeChartRef = ref<EchartsUIType>();
const callTeamChartRef = ref<EchartsUIType>();
const dealTrendChartRef = ref<EchartsUIType>();
const callTrendChartRef = ref<EchartsUIType>();

const { renderEcharts: renderStatusChart } = useEcharts(statusChartRef);
const { renderEcharts: renderCustomerTrendChart } = useEcharts(customerTrendChartRef);
const { renderEcharts: renderDealEmployeeChart } = useEcharts(dealEmployeeChartRef);
const { renderEcharts: renderDealTeamChart } = useEcharts(dealTeamChartRef);
const { renderEcharts: renderCallEmployeeChart } = useEcharts(callEmployeeChartRef);
const { renderEcharts: renderCallTeamChart } = useEcharts(callTeamChartRef);
const { renderEcharts: renderDealTrendChart } = useEcharts(dealTrendChartRef);
const { renderEcharts: renderCallTrendChart } = useEcharts(callTrendChartRef);

const statusText: Record<number, string> = {
  1: '待分配',
  2: '跟进中',
  3: '已成交',
  4: '无效',
};

type OverviewCard = {
  description: string;
  field: string;
  icon: Component | string;
  title: string;
  type: 'count' | 'percent';
};

const cards: OverviewCard[] = [
  {
    description: '当前客户总量',
    field: 'customerTotal',
    icon: SvgKeHuZongShuIcon,
    title: '客户总数',
    type: 'count',
  },
  {
    description: '已成交客户数量',
    field: 'dealTotal',
    icon: SvgJiangBeiIcon,
    title: '成交客户',
    type: 'count',
  },
  {
    description: '已绑定学校数量',
    field: 'schoolTotal',
    icon: SvgSchoolIcon,
    title: '学校数量',
    type: 'count',
  },
  {
    description: '当前团队数量',
    field: 'teamTotal',
    icon: SvgTeamIcon,
    title: '团队数量',
    type: 'count',
  },
  {
    description: '员工数量',
    field: 'employeeTotal',
    icon: SvgYuanGongIcon,
    title: '员工数量',
    type: 'count',
  },
  {
    description: '已分配给团队或员工的客户',
    field: 'assignedCustomerTotal',
    icon: SvgBangDingIcon,
    title: '已分配客户',
    type: 'count',
  },
  {
    description: '客户沟通记录总数',
    field: 'communicationTotal',
    icon: SvgGouTongIcon,
    title: '累计沟通次数',
    type: 'count',
  },
  {
    description: '已成交 / 已分配',
    field: 'conversionRate',
    icon: SvgCakeIcon,
    title: '成交率',
    type: 'percent',
  },
];

const overviewItems = computed(() =>
  cards.map((card) => ({
    icon: card.icon,
    title: card.title,
    description: card.description,
    type: card.type,
    value: Number(overviewStats.value[card.field] ?? 0),
  })),
);
const appliedQuickRange = computed(() =>
  QUICK_RANGES.find((days) => sameRange(appliedRange.value, createRange(days))),
);
const appliedRangeText = computed(() => `${appliedRange.value[0]} 至 ${appliedRange.value[1]}`);

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createRange(days: number): DateRange {
  const end = startOfToday();
  const start = addDays(end, -(days - 1));
  return [formatDate(start), formatDate(end)];
}

function rangeDays(range: DateRange) {
  const start = new Date(`${range[0]}T00:00:00`);
  const end = new Date(`${range[1]}T00:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / ONE_DAY_MS) + 1;
}

function sameRange(left: DateRange, right: DateRange) {
  return left[0] === right[0] && left[1] === right[1];
}

function normalizeRange(range: DateRange | undefined | null) {
  if (!range) throw new Error('请选择时间范围');
  const [start, end] = range;
  if (!start || !end) throw new Error('请选择时间范围');
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('请选择时间范围');
  }
  if (startDate.getTime() > endDate.getTime()) {
    throw new Error('开始日期不能晚于结束日期');
  }
  if (rangeDays([start, end]) > MAX_RANGE_DAYS) throw new Error('筛选时间最长为一个月');
  return [formatDate(startDate), formatDate(endDate)] as DateRange;
}

function buildDailySeries(rows: ChartTrendRow[], start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const map = new Map(rows.map((row) => [row.date, row.total]));
  const series: ChartTrendRow[] = [];
  for (let cursor = startDate; cursor.getTime() <= endDate.getTime(); cursor = addDays(cursor, 1)) {
    const date = formatDate(cursor);
    series.push({ date, total: map.get(date) ?? 0 });
  }
  return series;
}

function renderPieChart() {
  renderStatusChart({
    legend: {
      bottom: '2%',
      left: 'center',
    },
    series: [
      {
        animationDelay() {
          return Math.random() * 100;
        },
        animationEasing: 'exponentialInOut',
        animationType: 'scale',
        avoidLabelOverlap: false,
        color: ['#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9'],
        data: chartStats.value.statusStats.map((item) => ({
          name: statusText[item.status] || item.status,
          value: item.total,
        })),
        emphasis: {
          label: {
            fontSize: '12',
            fontWeight: 'bold',
            show: true,
          },
        },
        itemStyle: {
          borderRadius: 10,
          borderWidth: 2,
        },
        label: {
          position: 'center',
          show: false,
        },
        labelLine: {
          show: false,
        },
        name: '客户状态',
        radius: ['40%', '65%'],
        type: 'pie',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  });
}

function renderDailyLineChart(
  render: (option: Record<string, any>) => void,
  rows: ChartTrendRow[],
  color: string,
  name: string,
) {
  render({
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2%',
    },
    series: [
      {
        areaStyle: {},
        data: rows.map((item) => item.total),
        itemStyle: {
          color,
        },
        name,
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color,
          width: 1,
        },
      },
      trigger: 'axis',
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: rows.map((item) => item.date),
      splitLine: {
        lineStyle: {
          type: 'solid',
          width: 1,
        },
        show: true,
      },
      type: 'category',
    },
    yAxis: {
      splitArea: {
        show: true,
      },
      splitNumber: 4,
      type: 'value',
    },
  });
}

function renderHorizontalBarChart(
  render: (option: Record<string, any>) => void,
  rows: ChartRankRow[],
  color: string,
  name: string,
) {
  render({
    grid: {
      bottom: 16,
      containLabel: true,
      left: 90,
      right: 24,
      top: 20,
    },
    series: [
      {
        barWidth: 14,
        data: rows.map((item) => item.total),
        itemStyle: {
          color,
        },
        label: {
          position: 'right',
          show: true,
        },
        name,
        type: 'bar',
      },
    ],
    tooltip: {
      axisPointer: {
        type: 'shadow',
      },
      trigger: 'axis',
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
        show: true,
      },
      type: 'value',
    },
    yAxis: {
      axisTick: {
        show: false,
      },
      axisLabel: {
        width: 78,
        overflow: 'truncate',
      },
      data: rows.map((item) => item.name),
      inverse: true,
      type: 'category',
    },
  });
}

function renderCharts() {
  renderPieChart();
  renderDailyLineChart(renderCustomerTrendChart, chartStats.value.trends, '#5ab1ef', '新增客户');
  renderHorizontalBarChart(
    renderDealEmployeeChart,
    chartStats.value.dealEmployeeRanks,
    '#5470c6',
    '成交数量',
  );
  renderHorizontalBarChart(
    renderDealTeamChart,
    chartStats.value.dealTeamRanks,
    '#91cc75',
    '成交数量',
  );
  renderHorizontalBarChart(
    renderCallEmployeeChart,
    chartStats.value.callEmployeeRanks,
    '#fac858',
    '通话次数',
  );
  renderHorizontalBarChart(
    renderCallTeamChart,
    chartStats.value.callTeamRanks,
    '#ee6666',
    '通话次数',
  );
  renderDailyLineChart(renderDealTrendChart, chartStats.value.dealTrends, '#3b82f6', '总成交数量');
  renderDailyLineChart(renderCallTrendChart, chartStats.value.callTrends, '#f97316', '总通话次数');
}

async function loadOverview() {
  overviewStats.value = await overviewApi();
}

async function loadCharts(range: DateRange = appliedRange.value) {
  chartLoading.value = true;
  try {
    const data = await trendApi({
      endDate: range[1],
      startDate: range[0],
    });
    chartStats.value = {
      ...data,
      callTrends: buildDailySeries(data.callTrends, range[0], range[1]),
      dealTrends: buildDailySeries(data.dealTrends, range[0], range[1]),
      trends: buildDailySeries(data.trends, range[0], range[1]),
    };
    appliedRange.value = range;
    await nextTick();
    renderCharts();
  } finally {
    chartLoading.value = false;
  }
}

function openFilter() {
  draftRange.value = [...appliedRange.value] as DateRange;
  filterVisible.value = true;
}

function setQuickRange(days: number) {
  draftRange.value = createRange(days);
}

function resetFilter() {
  draftRange.value = createRange(7);
}

async function applyFilter() {
  try {
    const range = normalizeRange(draftRange.value);
    await loadCharts(range);
    filterVisible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '筛选时间无效');
  }
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function isQuickRangeActive(days: number) {
  return sameRange(draftRange.value, createRange(days));
}

onMounted(async () => {
  await Promise.all([loadOverview(), loadCharts()]);
});
</script>

<template>
  <Page title="概览">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ElCard v-for="item in overviewItems" :key="item.title" class="w-full" shadow="never">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-sm font-medium text-muted-foreground">
              {{ item.title }}
            </div>
            <div class="mt-2 text-3xl font-semibold tabular-nums">
              <template v-if="item.type === 'percent'">
                {{ formatPercent(item.value) }}
              </template>
              <template v-else>
                <VbenCountToAnimator :end-val="item.value" :start-val="0" prefix="" />
              </template>
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ item.description }}
            </div>
          </div>
          <component :is="item.icon" class="mt-1 size-8 shrink-0 text-primary" />
        </div>
      </ElCard>
    </div>

    <div class="mt-4 flex items-center justify-between gap-4">
      <div class="text-base font-medium">图表统计</div>
      <div class="flex flex-wrap items-center justify-end gap-2 text-sm text-muted-foreground">
        <span v-if="appliedQuickRange"> 近{{ appliedQuickRange }}天 · </span>
        <span>{{ appliedRangeText }}</span>
        <ElButton plain @click="openFilter">
          <span class="inline-flex items-center gap-1">
            <IconifyIcon class="size-4" icon="lucide:filter" />
            筛选
          </span>
        </ElButton>
      </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <ElCard shadow="never">
        <template #header>客户状态</template>
        <EchartsUI ref="statusChartRef" height="360px" />
      </ElCard>

      <ElCard shadow="never">
        <template #header>新增客户</template>
        <EchartsUI ref="customerTrendChartRef" height="360px" />
      </ElCard>
    </div>

    <div class="mt-6 text-base font-medium">成交排行</div>
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <ElCard shadow="never">
        <template #header>个人成交排行</template>
        <EchartsUI ref="dealEmployeeChartRef" height="360px" />
      </ElCard>

      <ElCard shadow="never">
        <template #header>团队成交排行</template>
        <EchartsUI ref="dealTeamChartRef" height="360px" />
      </ElCard>
    </div>

    <div class="mt-6 text-base font-medium">通话次数排行</div>
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <ElCard shadow="never">
        <template #header>个人通话次数排行</template>
        <EchartsUI ref="callEmployeeChartRef" height="360px" />
      </ElCard>

      <ElCard shadow="never">
        <template #header>团队通话次数排行</template>
        <EchartsUI ref="callTeamChartRef" height="360px" />
      </ElCard>
    </div>

    <div class="mt-6 text-base font-medium">总量趋势</div>
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <ElCard shadow="never">
        <template #header>总成交数量</template>
        <EchartsUI ref="dealTrendChartRef" height="360px" />
      </ElCard>

      <ElCard shadow="never">
        <template #header>总通话次数</template>
        <EchartsUI ref="callTrendChartRef" height="360px" />
      </ElCard>
    </div>

    <ElDialog v-model="filterVisible" title="筛选图表" width="560px">
      <div class="flex flex-col gap-6">
        <div>
          <div class="mb-3 text-sm font-medium">快速范围</div>
          <div class="flex flex-wrap gap-2">
            <ElButton
              v-for="days in QUICK_RANGES"
              :key="days"
              :type="isQuickRangeActive(days) ? 'primary' : 'default'"
              @click="setQuickRange(days)"
            >
              {{ days }}天
            </ElButton>
          </div>
        </div>

        <div>
          <div class="mb-3 text-sm font-medium">自定义时间范围</div>
          <ElDatePicker
            v-model="draftRange"
            end-placeholder="结束日期"
            range-separator="至"
            start-placeholder="开始日期"
            style="width: 100%"
            type="daterange"
            value-format="YYYY-MM-DD"
          />
          <div class="mt-2 text-xs text-muted-foreground">最长一个月</div>
        </div>
      </div>

      <template #footer>
        <ElButton :disabled="chartLoading" @click="resetFilter">重置</ElButton>
        <ElButton :loading="chartLoading" type="primary" @click="applyFilter">
          应用筛选器
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
