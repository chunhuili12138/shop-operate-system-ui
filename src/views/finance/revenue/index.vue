<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getRevenueList } from "@/api/finance";

defineOptions({ name: "FinanceRevenue" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const load = async () => {
  loading.value = true;
  try {
    const r = await getRevenueList({
      page: page.value,
      size: size.value
    });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <!-- 表格区 -->
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
                style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="game_session_id" label="游玩ID" />
        <el-table-column prop="amount" label="金额" width="100" align="center" />
        <el-table-column prop="staff_name" label="确认员工" width="120" />
        <el-table-column prop="confirmed_at" label="确认时间" width="170" />
      </el-table>
    </div>

    <!-- 分页区 -->
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination"
      @size-change="onSizeChange"
      @current-change="load"
    />
  </div>
</template>
