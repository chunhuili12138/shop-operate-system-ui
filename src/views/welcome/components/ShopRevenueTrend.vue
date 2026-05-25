<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";
import type { TrendItem } from "@/api/dashboard";

const props = defineProps<{ revenues: TrendItem[]; expenses: TrendItem[] }>();

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chart) return;
  const periods = (props.revenues || []).map(d => d.period);
  const revValues = (props.revenues || []).map(d => d.total || 0);
  const expValues = (props.expenses || []).map(d => d.total || 0);

  chart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (p: any) => {
        let r = `${p[0].axisValue}<br/>`;
        p.forEach((item: any) => {
          r += `${item.marker}${item.seriesName}: <b>¥${Number(item.value).toFixed(2)}</b><br/>`;
        });
        return r;
      }
    },
    legend: {
      data: ["收入", "支出"],
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11 }
    },
    grid: { left: 50, right: 12, top: 10, bottom: 30 },
    xAxis: {
      type: "category",
      data: periods,
      axisLabel: { fontSize: 10, color: "#999" },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 10,
        color: "#999",
        formatter: (v: number) =>
          v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v)
      },
      splitLine: { lineStyle: { color: "#f0f0f0" } }
    },
    series: [
      {
        name: "收入",
        data: revValues,
        type: "bar",
        barMaxWidth: 20,
        itemStyle: { color: "#667eea", borderRadius: [4, 4, 0, 0] }
      },
      {
        name: "支出",
        data: expValues,
        type: "bar",
        barMaxWidth: 20,
        itemStyle: { color: "#f56c6c", borderRadius: [4, 4, 0, 0] }
      }
    ]
  });
};

const resize = () => chart?.resize();

onMounted(() => {
  initChart();
  window.addEventListener("resize", resize);
});
onUnmounted(() => {
  window.removeEventListener("resize", resize);
  chart?.dispose();
});
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 280px" />
</template>
