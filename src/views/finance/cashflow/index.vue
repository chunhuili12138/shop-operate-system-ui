<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { getCashFlow } from "@/api/finance";

defineOptions({ name: "FinanceCashFlow" });

const tableData = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const query = reactive({ dateRange: [] as string[] });

const load = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, size: size.value };
    if (query.dateRange?.length === 2) {
      params.startDate = query.dateRange[0];
      params.endDate = query.dateRange[1];
    }
    const r = await getCashFlow(params);
    if (r?.success) { tableData.value = r.data.list; total.value = r.data.total; }
  } finally { loading.value = false; }
};

const onSearch = () => { page.value = 1; load(); };
const onReset = () => { query.dateRange = []; page.value = 1; load(); };
const onSizeChange = (s: number) => { size.value = s; page.value = 1; load(); };

onMounted(load);
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <el-form :model="query" inline class="page-search">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="query.dateRange" type="daterange" range-separator="-"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
            style="width:260px" @change="onSearch"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div />
        <div>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>
    </div>

    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.flow_type === '收入' ? 'success' : 'danger'" size="small">
              {{ row.flow_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.flow_type === '收入' ? 'var(--el-color-success)' : 'var(--el-color-danger)' }">
              {{ row.flow_type === '收入' ? '+' : '-' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="relate_name" label="关联信息" min-width="140" show-overflow-tooltip />
        <el-table-column prop="desc_name" label="说明" min-width="160" show-overflow-tooltip />
        <el-table-column prop="flow_date" label="日期" width="120" />
        <template #empty><el-empty description="暂无流水记录" /></template>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="page" v-model:page-size="size" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination" @size-change="onSizeChange" @current-change="load"
    />
  </div>
</template>
