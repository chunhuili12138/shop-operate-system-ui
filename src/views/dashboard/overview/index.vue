<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import { getDashboardToday } from "@/api/dashboard";

defineOptions({ name: "DashboardOverview" });

const data = ref<any>({});
const loading = ref(true);
const isSuper = useUserStoreHook().superAdmin;

const statCards = computed(() =>
  isSuper.value
    ? [
        {
          label: "入驻商户",
          key: "totalTenants",
          color: "var(--color-stat-blue)"
        },
        {
          label: "总店铺数",
          key: "totalShops",
          color: "var(--color-stat-green)"
        },
        {
          label: "生效席位",
          key: "activeSeats",
          color: "var(--color-stat-orange)"
        },
        {
          label: "本月新增商户",
          key: "newTenantsThisMonth",
          color: "var(--color-stat-red)"
        }
      ]
    : [
        {
          label: "今日收现",
          key: "todaySales",
          color: "var(--color-stat-blue)",
          prefix: "¥"
        },
        {
          label: "今日确认收入",
          key: "todayRevenue",
          color: "var(--color-stat-green)",
          prefix: "¥"
        },
        {
          label: "今日订单",
          key: "todayOrders",
          color: "var(--color-stat-orange)"
        },
        {
          label: "今日核销",
          key: "todayCheckins",
          color: "var(--color-stat-purple)"
        },
        {
          label: "新顾客数",
          key: "todayNewCustomers",
          color: "var(--color-stat-red)"
        }
      ]
);

const load = async () => {
  loading.value = true;
  try {
    const r = await getDashboardToday();
    if (r?.success) data.value = r.data || {};
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="app-container">
    <el-row :gutter="16" class="mb-4">
      <el-col
        v-for="card in statCards"
        :key="card.key"
        :lg="4"
        :md="8"
        :sm="12"
        :xs="24"
      >
        <el-card shadow="never">
          <div class="text-sm text-dim">{{ card.label }}</div>
          <div class="text-2xl font-bold" :style="{ color: card.color }">
            {{ card.prefix || "" }}{{ data[card.key] ?? "-" }}
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <span class="font-medium">到期提醒</span>
          </template>
          <div v-if="data.expiringSoon?.length">
            <div
              v-for="item in data.expiringSoon"
              :key="item.id"
              class="text-sm py-1 border-b border-[var(--ad-border)] last:border-0"
              style="color: var(--el-color-danger)"
            >
              {{ item.tenant_name }} — 席位 {{ item.end_date }} 到期
            </div>
          </div>
          <div v-else class="text-dim">暂无到期提醒</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span class="font-medium">库存预警</span>
          </template>
          <div class="text-dim">详见库存管理页面</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
