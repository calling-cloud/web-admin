<script lang="ts" setup>
import type { Component } from 'vue';

import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, onMounted, ref } from 'vue';

import { Page, VbenCountToAnimator } from '@vben/common-ui';
import {
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

import { ElCard } from 'element-plus';

import { overviewApi, trendApi } from '#/api';

const stats = ref<Record<string, any>>({});
const trends = ref<Array<{ date: string; total: number }>>([]);
const statusChartRef = ref<EchartsUIType>();
const trendChartRef = ref<EchartsUIType>();
const { renderEcharts: renderStatusChart } = useEcharts(statusChartRef);
const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef);
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
  cards.map((card) => {
    return {
      icon: card.icon,
      title: card.title,
      description: card.description,
      type: card.type,
      value: Number(stats.value[card.field] ?? 0),
    };
  }),
);

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function renderCharts() {
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
        data: (stats.value.statusStats || []).map((item: any) => ({
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

  renderTrendChart({
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
        data: trends.value.map((item) => item.total),
        itemStyle: {
          color: '#5ab1ef',
        },
        name: '新增客户',
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#019680',
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
      data: trends.value.map((item) => item.date),
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

onMounted(async () => {
  const [overview, trend] = await Promise.all([overviewApi(), trendApi()]);
  stats.value = overview;
  trends.value = trend;
  renderCharts();
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

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <ElCard>
        <template #header>客户状态</template>
        <EchartsUI ref="statusChartRef" height="360px" />
      </ElCard>

      <ElCard>
        <template #header>近30天新增客户</template>
        <EchartsUI ref="trendChartRef" height="360px" />
      </ElCard>
    </div>
  </Page>
</template>
