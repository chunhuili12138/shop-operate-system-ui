<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import { grantCoupon } from "@/api/marketing";
import { getCustomerList } from "@/api/customer";

defineOptions({ name: "CouponGrantDialog" });

const props = defineProps<{ visible: boolean; couponId: number; perUserLimit: number }>();
const emit = defineEmits<{ (e: "update:visible", v: boolean): void; (e: "submit"): void }>();

const loading = ref(false);
const selectedIds = ref<number[]>([]);
const customers = ref<any[]>([]);
const customerLoading = ref(false);

const searchCustomers = async (keyword: string) => {
  customerLoading.value = true;
  try {
    const r = await getCustomerList({ page: 1, size: 100, keyword });
    if (r?.success) customers.value = r.data?.list || [];
  } finally {
    customerLoading.value = false;
  }
};

const doGrant = async () => {
  if (selectedIds.value.length === 0) return;

  // per_user_limit 二次确认
  if (props.perUserLimit > 0) {
    try {
      await ElMessageBox.confirm(
        `当前优惠券每人限领 ${props.perUserLimit} 张，所选顾客中可能存在已超过上限的情况，确定继续发放吗？`,
        "温馨提示",
        { confirmButtonText: "继续发放", cancelButtonText: "取消", type: "warning" }
      );
    } catch {
      return;
    }
  }

  loading.value = true;
  try {
    const r = await grantCoupon({
      couponId: props.couponId,
      customerIds: selectedIds.value.join(",")
    });
    if (r?.success) {
      message("已成功发放 " + selectedIds.value.length + " 张", { type: "success" });
      emit("update:visible", false);
      emit("submit");
    } else {
      message(r?.msg || "发放失败", { type: "warning" });
    }
  } catch {
    message("网络异常", { type: "error" });
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  val => {
    if (val) {
      selectedIds.value = [];
      customers.value = [];
    }
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="发放优惠券"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form label-width="80px">
      <el-form-item label="选择顾客">
        <el-select
          v-model="selectedIds"
          multiple
          filterable
          remote
          reserve-keyword
          :remote-method="searchCustomers"
          :loading="customerLoading"
          placeholder="输入姓名/手机号搜索顾客"
          style="width: 100%"
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="c in customers"
            :key="c.id"
            :label="c.nickname + ' (' + c.phone + ')'"
            :value="c.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="selectedIds.length === 0"
        @click="doGrant"
      >
        确认发放 ({{ selectedIds.length }})
      </el-button>
    </template>
  </el-dialog>
</template>
