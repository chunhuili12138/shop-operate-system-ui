<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from "vue";
import * as echarts from "echarts";
import type { TrendItem } from "@/api/dashboard";

const props = defineProps<{
  data: TrendItem[];
  loading?: boolean;
  height?: string;
}>();

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;
const themeColor = "#667eea";

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
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>订阅收入: <b style="color:${themeColor}">¥${Number(p.value).toLocaleString()}</b>`;
        }
      },
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: "category",
        data: periods,
        axisLabel: { color: "#999", fontSize: 11 },
        axisLine: { lineStyle: { color: "#e0e0e0" } }
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#999",
          fontSize: 11,
          formatter: (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v))
        },
        splitLine: { lineStyle: { color: "#f0f0f0", type: "dashed" } }
      },
      series: [
        {
          data: values,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: themeColor, width: 3 },
          itemStyle: {
            color: themeColor,
            borderColor: "#fff",
            borderWidth: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(102,126,234,0.3)" },
              { offset: 1, color: "rgba(102,126,234,0.02)" }
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
