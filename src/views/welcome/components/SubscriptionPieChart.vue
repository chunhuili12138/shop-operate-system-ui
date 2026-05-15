<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import type { SubscriptionDistribution } from "@/api/dashboard";

const props = defineProps<{
  data: SubscriptionDistribution;
  loading?: boolean;
  height?: string;
}>();

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chart) return;
  const d = props.data;
  const names = ["月付订阅", "年付订阅"];
  const counts = [
    { value: d?.monthlyCount || 0, name: "月付订阅" },
    { value: d?.yearlyCount || 0, name: "年付订阅" }
  ];

  chart.setOption(
    {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const data = params.data;
          const total = (d?.monthlyCount || 0) + (d?.yearlyCount || 0);
          const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0";
          return `${data.name}<br/>数量: <b>${data.value}</b> 个 (${pct}%)`;
        }
      },
      legend: {
        bottom: 10,
        textStyle: { fontSize: 12, color: "#666" }
      },
      series: [
        {
          name: "订阅类型",
          type: "pie",
          radius: ["45%", "70%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: "#fff",
            borderWidth: 3
          },
          label: {
            show: true,
            formatter: "{b}\n{d}%",
            fontSize: 11
          },
          emphasis: {
            label: { fontSize: 16, fontWeight: "bold" }
          },
          color: ["#667eea", "#4facfe"],
          data: counts
        }
      ]
    },
    { notMerge: true }
  );
};

watch(
  () => props.data,
  () => updateChart(),
  { deep: true }
);

onMounted(initChart);
onUnmounted(() => chart?.dispose());

const handleResize = () => chart?.resize();
window.addEventListener("resize", handleResize);
onUnmounted(() => window.removeEventListener("resize", handleResize));
</script>

<template>
  <div ref="chartRef" :style="{ width: '100%', height: height || '300px' }" />
</template>
