<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, onMounted, ref } from 'vue';

import { AnalysisOverview, Page } from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
  SvgQQChatIcon,
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

const cards = [
  { field: 'customerTotal', icon: SvgCardIcon, title: '客户总数' },
  { field: 'dealTotal', icon: SvgCakeIcon, title: '成交客户' },
  { field: 'schoolTotal', icon: SvgDownloadIcon, title: '学校数量' },
  { field: 'teamTotal', icon: SvgQQChatIcon, title: '团队数量' },
  { field: 'employeeTotal', icon: SvgBellIcon, title: '员工数量' },
];

const overviewItems = computed<AnalysisOverviewItem[]>(() =>
  cards.map((card) => {
    const value = Number(stats.value[card.field] ?? 0);
    return {
      icon: card.icon,
      title: card.title,
      totalTitle: '总数',
      totalValue: value,
      value,
    };
  }),
);

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
    <AnalysisOverview :items="overviewItems" />

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
