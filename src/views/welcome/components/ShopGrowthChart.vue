<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import type { TrendItem } from "@/api/dashboard";

const props = defineProps<{
  data: TrendItem[];
  loading?: boolean;
  height?: string;
}>();

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;
const themeColor = "#4facfe";

const initChart = () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chart) return;
  const periods = (props.data || []).map((d) => d.period);
  const values = (props.data || []).map((d) => d.count || 0);

  chart.setOption(
    {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>新增店铺: <b style="color:${themeColor}">${p.value} 家</b>`;
        }
      },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: "category",
        data: periods,
        axisLabel: { color: "#999", fontSize: 11 },
        axisLine: { lineStyle: { color: "#e0e0e0" } }
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { color: "#999", fontSize: 11 },
        splitLine: { lineStyle: { color: "#f0f0f0", type: "dashed" } }
      },
      series: [
        {
          data: values,
          type: "bar",
          barWidth: 20,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(79,172,254,0.8)" },
              { offset: 1, color: "rgba(0,242,254,0.6)" }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#4facfe" },
                { offset: 1, color: "#00f2fe" }
              ])
            }
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

onUnmounted(() => {
  chart?.dispose();
});

const handleResize = () => chart?.resize();
window.addEventListener("resize", handleResize);
onUnmounted(() => window.removeEventListener("resize", handleResize));
</script>

<template>
  <div ref="chartRef" :style="{ width: '100%', height: height || '300px' }" />
</template>
