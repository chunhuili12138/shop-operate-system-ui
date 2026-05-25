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
  const periods = (props.data || []).map(d => d.period);
  const values = (props.data || []).map(d => d.count || 0);

  chart.setOption(
    {
      tooltip: {
        trigger: "axis",
        formatter: (p: any) =>
          `${p[0].axisValue}<br/>新增店铺: <b>${p[0].value} 家</b>`
      },
      grid: { left: 35, right: 12, top: 8, bottom: 22 },
      xAxis: {
        type: "category",
        data: periods,
        axisLabel: { fontSize: 10, color: "#999" },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { fontSize: 10, color: "#999" },
        splitLine: { lineStyle: { color: "#f0f0f0" } }
      },
      series: [
        {
          data: values,
          type: "bar",
          barWidth: 16,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#4facfe" },
              { offset: 1, color: "#00f2fe" }
            ])
          }
        }
      ]
    },
    { notMerge: true }
  );
};

watch(
  () => props.data,
  () => updateChart()
);
onMounted(initChart);
onUnmounted(() => chart?.dispose());
const h = () => chart?.resize();
window.addEventListener("resize", h);
onUnmounted(() => window.removeEventListener("resize", h));
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 200px" />
</template>
