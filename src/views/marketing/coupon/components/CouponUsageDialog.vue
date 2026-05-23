<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { getCouponUsages } from "@/api/marketing";

defineOptions({ name: "CouponUsageDialog" });

const props = defineProps<{ visible: boolean; couponId: number }>();
const emit = defineEmits<{ (e: "update:visible", v: boolean): void }>();

const usageList = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({
  customerKeyword: "",
  status: undefined as number | undefined,
  receivedStart: "",
  receivedEnd: "",
  usedStart: "",
  usedEnd: ""
});

const load = async () => {
  if (!props.couponId) return;
  loading.value = true;
  try {
    const r = await getCouponUsages({
      couponId: props.couponId,
      page: page.value,
      size: size.value,
      ...query
    });
    if (r?.success) {
      usageList.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  Object.assign(query, {
    customerKeyword: "",
    status: undefined as number | undefined,
    receivedStart: "",
    receivedEnd: "",
    usedStart: "",
    usedEnd: ""
  });
  page.value = 1;
  load();
};

watch(
  () => props.visible,
  val => {
    if (val) {
      Object.assign(query, {
        customerKeyword: "",
        status: undefined as number | undefined,
        receivedStart: "",
        receivedEnd: "",
        usedStart: "",
        usedEnd: ""
      });
      page.value = 1;
      load();
    }
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="使用记录"
    width="900px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form :model="query" inline class="usage-filter">
      <el-form-item label="领取时间">
        <el-date-picker
          v-model="query.receivedStart"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="开始时间"
          style="width: 130px"
        />
        <span style="margin: 0 4px; color: #909399">-</span>
        <el-date-picker
          v-model="query.receivedEnd"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="结束时间"
          style="width: 130px"
        />
      </el-form-item>
      <el-form-item label="使用时间">
        <el-date-picker
          v-model="query.usedStart"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="开始时间"
          style="width: 130px"
        />
        <span style="margin: 0 4px; color: #909399">-</span>
        <el-date-picker
          v-model="query.usedEnd"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="结束时间"
          style="width: 130px"
        />
      </el-form-item>
      <el-form-item label="顾客">
        <el-input
          v-model="query.customerKeyword"
          clearable
          placeholder="姓名/手机号"
          style="width: 150px"
          @keyup.enter="load"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="query.status"
          clearable
          placeholder="全部"
          style="width: 100px"
          @change="load"
        >
          <el-option label="未使用" :value="1" />
          <el-option label="已使用" :value="2" />
          <el-option label="已过期" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="usageList"
      style="width: 100%"
      max-height="380"
    >
      <el-table-column prop="customer_name" label="顾客" min-width="120">
        <template #default="{ row }">
          {{ row.customer_name || "-" }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag
            :type="
              row.status === 1
                ? 'info'
                : row.status === 2
                  ? 'success'
                  : 'warning'
            "
            size="small"
          >
            {{ ["", "未使用", "已使用", "已过期"][row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="received_at" label="领取时间" width="170" />
      <el-table-column prop="expires_at" label="过期时间" width="170" />
      <el-table-column prop="used_at" label="使用时间" width="170">
        <template #default="{ row }">
          {{ row.used_at || "-" }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      size="small"
      style="margin-top: 12px; justify-content: flex-end"
      @size-change="load"
      @current-change="load"
    />
  </el-dialog>
</template>

<style scoped>
.usage-filter :deep(.el-form-item) {
  margin-bottom: 8px;
}
</style>
