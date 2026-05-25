<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import type { SubscriptionDistribution } from "@/api/dashboard";

const props = defineProps<{ data: SubscriptionDistribution }>();

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
  chart.setOption(
    {
      tooltip: { trigger: "item", formatter: "{b}: {c} 个 ({d}%)" },
      series: [
        {
          type: "pie",
          radius: ["40%", "65%"],
          center: ["50%", "50%"],
          itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14 } },
          color: ["#667eea", "#4facfe"],
          data: [
            { value: d?.monthlyCount || 0, name: "月付" },
            { value: d?.yearlyCount || 0, name: "年付" }
          ]
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
const h = () => chart?.resize();
window.addEventListener("resize", h);
onUnmounted(() => window.removeEventListener("resize", h));
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 110px" />
</template>
