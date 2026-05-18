<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import type { TrendItem } from "@/api/dashboard";

const props = defineProps<{ data: TrendItem[] }>();

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chart) return;
  const periods = (props.data || []).map((d) => d.period);
  const values = (props.data || []).map((d) => d.total || 0);

  chart.setOption(
    {
      tooltip: {
        trigger: "axis",
        formatter: (p: any) => `${p[0].axisValue}<br/>订阅收入: <b>¥${Number(p[0].value).toLocaleString()}</b>`
      },
      grid: { left: 45, right: 12, top: 8, bottom: 22 },
      xAxis: { type: "category", data: periods, axisLabel: { fontSize: 10, color: "#999" }, axisLine: { show: false }, axisTick: { show: false } },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 10, color: "#999", formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v) },
        splitLine: { lineStyle: { color: "#f0f0f0" } }
      },
      series: [{
        data: values, type: "line", smooth: true, symbol: "none",
        lineStyle: { color: "#667eea", width: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(102,126,234,0.25)" }, { offset: 1, color: "rgba(102,126,234,0.02)" }]) }
      }]
    },
    { notMerge: true }
  );
};

watch(() => props.data, () => updateChart());
onMounted(initChart);
onUnmounted(() => chart?.dispose());
const h = () => chart?.resize();
window.addEventListener("resize", h);
onUnmounted(() => window.removeEventListener("resize", h));
</script>

<template>
  <div ref="chartRef" style="width:100%;height:200px" />
</template>
