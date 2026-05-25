<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import {
  grantCoupon,
  grantCouponBatch,
  getGrantPreview
} from "@/api/marketing";
import { getCustomerList } from "@/api/customer";
import { getDictData } from "@/api/dict";

defineOptions({ name: "CouponGrantDialog" });

const props = defineProps<{
  visible: boolean;
  couponId: number;
  couponName: string;
  couponType: number;
  couponValue: number;
  remainStock: number;
  perUserLimit: number;
}>();
const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "submit"): void;
}>();

// ===== 通用 =====
const mode = ref<"manual" | "batch">("manual");
const loading = ref(false);

// ===== 手动选择模式 =====
const customers = ref<any[]>([]);
const tableLoading = ref(false);
const tableRef = ref<any>();
const keyword = ref("");
const manualPage = ref(1);
const manualSize = ref(20);
const manualTotal = ref(0);
const selectedMap = ref<Record<number, any>>({});
const selectedCount = computed(() => Object.keys(selectedMap.value).length);

const typeLabel = computed(
  () => ["", "固定金额", "百分比", "兑换券"][props.couponType] || ""
);

const loadCustomers = async () => {
  tableLoading.value = true;
  try {
    const r = await getCustomerList({
      page: manualPage.value,
      size: manualSize.value,
      keyword: keyword.value || undefined
    });
    if (r?.success) {
      customers.value = r.data?.list || [];
      manualTotal.value = r.data?.total || 0;
    }
  } finally {
    tableLoading.value = false;
  }
};

const handleSelect = (rows: any[]) => {
  // 增量更新 selectedMap，保留跨页已选
  const newMap: Record<number, any> = {};
  rows.forEach(r => {
    newMap[r.id] = r;
  });
  // 当前页不在 rows 中的，从 map 移除
  const currentPageIds = new Set(customers.value.map((c: any) => c.id));
  Object.keys(selectedMap.value).forEach(id => {
    if (!currentPageIds.has(Number(id))) {
      newMap[Number(id)] = selectedMap.value[Number(id)];
    }
  });
  selectedMap.value = newMap;
};

const clearSelected = () => {
  selectedMap.value = {};
  tableRef.value?.clearSelection();
};

const doManualGrant = async () => {
  const ids = Object.keys(selectedMap.value);
  if (ids.length === 0) return;
  if (props.perUserLimit > 0) {
    try {
      await ElMessageBox.confirm(
        `当前优惠券每人限领 ${props.perUserLimit} 张，确定发放给 ${ids.length} 位顾客吗？`,
        "温馨提示",
        {
          confirmButtonText: "继续发放",
          cancelButtonText: "取消",
          type: "warning"
        }
      );
    } catch {
      return;
    }
  }
  loading.value = true;
  try {
    const r = await grantCoupon({
      couponId: props.couponId,
      customerIds: ids.join(",")
    });
    if (r?.success) {
      message("已发放 " + ids.length + " 张", { type: "success" });
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

// ===== 按条件发放模式 =====
const batchTags = ref<string[]>([]);
const batchSource = ref("");
const tagOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);
const sourceOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);
const previewList = ref<any[]>([]);
const previewLoading = ref(false);
const batchTableRef = ref<any>();
const batchSelectedMap = ref<Record<number, any>>({});
const batchSelectedCount = computed(
  () => Object.keys(batchSelectedMap.value).length
);

const loadDicts = async () => {
  try {
    const [tR, sR] = await Promise.all([
      getDictData("customer_tag"),
      getDictData("customer_source")
    ]);
    if (tR?.success && Array.isArray(tR.data)) tagOptions.value = tR.data;
    if (sR?.success && Array.isArray(sR.data)) sourceOptions.value = sR.data;
  } catch {
    /* ignore */
  }
};

loadDicts();

const doPreview = async () => {
  if (batchTags.value.length === 0 && !batchSource.value) return;
  previewLoading.value = true;
  try {
    const r = await getGrantPreview({
      couponId: props.couponId,
      tags: batchTags.value.length > 0 ? batchTags.value.join(",") : undefined,
      source: batchSource.value || undefined
    });
    if (r?.success && Array.isArray(r.data)) {
      previewList.value = r.data;
      batchSelectedMap.value = {};
      // 等待表格渲染后再同步勾选状态
      await nextTick();
      r.data.forEach((c: any) => {
        if (c.canGrant) {
          batchSelectedMap.value[c.id] = c;
          batchTableRef.value?.toggleRowSelection(c, true);
        }
      });
    }
  } finally {
    previewLoading.value = false;
  }
};

const handleBatchSelect = (rows: any[]) => {
  const newMap: Record<number, any> = {};
  rows.forEach(r => {
    newMap[r.id] = r;
  });
  batchSelectedMap.value = newMap;
};

const removeBatch = (id: number) => {
  const m = { ...batchSelectedMap.value };
  delete m[id];
  batchSelectedMap.value = m;
  // 同步表格勾选状态
  const row = previewList.value.find((c: any) => c.id === id);
  if (row && batchTableRef.value) {
    batchTableRef.value.toggleRowSelection(row, false);
  }
};

const doBatchGrant = async () => {
  const ids = Object.keys(batchSelectedMap.value);
  if (ids.length === 0) return;
  if (props.perUserLimit > 0) {
    try {
      await ElMessageBox.confirm(
        `当前优惠券每人限领 ${props.perUserLimit} 张，确定发放给 ${ids.length} 位顾客吗？`,
        "温馨提示",
        {
          confirmButtonText: "继续发放",
          cancelButtonText: "取消",
          type: "warning"
        }
      );
    } catch {
      return;
    }
  }
  loading.value = true;
  try {
    const r = await grantCouponBatch({
      couponId: props.couponId,
      customerIds: ids.join(",")
    });
    if (r?.success) {
      const d = r.data;
      message(`发放完成：成功 ${d.granted} 人，跳过 ${d.skipped} 人`, {
        type: "success"
      });
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
      mode.value = "manual";
      keyword.value = "";
      manualPage.value = 1;
      selectedMap.value = {};
      batchTags.value = [];
      batchSource.value = "";
      previewList.value = [];
      batchSelectedMap.value = {};
      loadCustomers();
    }
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="发放优惠券"
    width="750px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <!-- 优惠券信息 -->
    <div class="coupon-info">
      <el-descriptions :column="3" size="small" border>
        <el-descriptions-item label="优惠券">{{
          couponName
        }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{
          typeLabel
        }}</el-descriptions-item>
        <el-descriptions-item label="面值">{{
          couponType === 2 ? couponValue + "%" : "¥" + couponValue
        }}</el-descriptions-item>
        <el-descriptions-item label="每人限领">{{
          perUserLimit === 0 ? "不限" : perUserLimit + "张"
        }}</el-descriptions-item>
        <el-descriptions-item label="剩余库存">
          <span
            :style="{
              color: remainStock === 0 ? '#f56c6c' : '#67c23a',
              fontWeight: 700
            }"
            >{{ remainStock }}</span
          >
        </el-descriptions-item>
        <el-descriptions-item label="有效期"
          >{{
            "领取后" + (couponType === 0 ? "" : "")
          }}
          天</el-descriptions-item
        >
      </el-descriptions>
    </div>

    <!-- 模式切换 -->
    <el-radio-group v-model="mode" style="margin: 16px 0 12px">
      <el-radio-button value="manual">手动选择</el-radio-button>
      <el-radio-button value="batch">按条件发放</el-radio-button>
    </el-radio-group>

    <!-- ========== 手动选择模式 ========== -->
    <template v-if="mode === 'manual'">
      <!-- 已选标签区 -->
      <div v-if="selectedCount > 0" class="selected-area">
        <span style=" margin-right: 8px;font-size: 13px; color: #606266"
          >已选 {{ selectedCount }} 人</span
        >
        <el-tag
          v-for="(item, id) in selectedMap"
          :key="id"
          closable
          size="small"
          style="margin: 2px 4px"
          @close="removeSelected(Number(id))"
        >
          {{ item.nickname || item.phone || id }}
        </el-tag>
        <el-button link type="danger" size="small" @click="clearSelected"
          >清空</el-button
        >
      </div>

      <!-- 搜索栏 -->
      <el-form inline>
        <el-form-item>
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索姓名/手机号"
            style="width: 200px"
            @keyup.enter="
              manualPage = 1;
              loadCustomers();
            "
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="
              manualPage = 1;
              loadCustomers();
            "
            >查询</el-button
          >
        </el-form-item>
      </el-form>

      <!-- 顾客表格 -->
      <el-table
        ref="tableRef"
        v-loading="tableLoading"
        :data="customers"
        style="width: 100%"
        max-height="320"
        row-key="id"
        @selection-change="handleSelect"
      >
        <el-table-column
          type="selection"
          width="40"
          :reserve-selection="true"
        />
        <el-table-column prop="nickname" label="姓名" min-width="100">
          <template #default="{ row }">{{ row.nickname || "-" }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">{{ row.phone || "-" }}</template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" min-width="120">
          <template #default="{ row }">{{ row.tags || "-" }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="manualPage"
        v-model:page-size="manualSize"
        :total="manualTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        size="small"
        style=" justify-content: flex-end;margin-top: 8px"
        @size-change="loadCustomers"
        @current-change="loadCustomers"
      />
    </template>

    <!-- ========== 按条件发放模式 ========== -->
    <template v-if="mode === 'batch'">
      <el-form label-width="80px" style="margin-top: 4px">
        <el-form-item label="顾客标签">
          <el-select
            v-model="batchTags"
            multiple
            filterable
            placeholder="选择标签（可多选）"
            style="width: 100%"
            collapse-tags
          >
            <el-option
              v-for="t in tagOptions"
              :key="t.dict_key"
              :label="t.dict_value"
              :value="t.dict_value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="顾客来源">
          <el-select
            v-model="batchSource"
            clearable
            placeholder="不限来源"
            style="width: 100%"
          >
            <el-option
              v-for="s in sourceOptions"
              :key="s.dict_key"
              :label="s.dict_value"
              :value="s.dict_label"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="batchTags.length === 0 && !batchSource"
            :loading="previewLoading"
            @click="doPreview"
          >
            查询顾客
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 预览结果 -->
      <template v-if="previewList.length > 0">
        <div class="selected-area">
          <span style=" margin-right: 8px;font-size: 13px; color: #606266"
            >待发放 {{ batchSelectedCount }} 人</span
          >
          <el-tag
            v-for="(item, id) in batchSelectedMap"
            :key="id"
            closable
            size="small"
            style="margin: 2px 4px"
            @close="removeBatch(Number(id))"
          >
            {{ item.nickname || item.phone || id }}
          </el-tag>
        </div>
        <el-table
          ref="batchTableRef"
          :data="previewList"
          style="width: 100%"
          max-height="240"
          row-key="id"
          @selection-change="handleBatchSelect"
        >
          <el-table-column
            type="selection"
            width="40"
            :selectable="(row: any) => row.canGrant"
          />
          <el-table-column prop="nickname" label="姓名" min-width="100">
            <template #default="{ row }">{{ row.nickname || "-" }}</template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="130">
            <template #default="{ row }">{{ row.phone || "-" }}</template>
          </el-table-column>
          <el-table-column prop="tags" label="标签" min-width="100">
            <template #default="{ row }">{{ row.tags || "-" }}</template>
          </el-table-column>
          <el-table-column label="可发放" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.canGrant ? 'success' : 'warning'" size="small">
                {{ row.canGrant ? "可" : "已满" }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </template>

    <!-- Footer -->
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        v-if="mode === 'manual'"
        type="primary"
        :loading="loading"
        :disabled="selectedCount === 0"
        @click="doManualGrant"
      >
        确认发放 ({{ selectedCount }})
      </el-button>
      <el-button
        v-if="mode === 'batch'"
        type="primary"
        :loading="loading"
        :disabled="batchSelectedCount === 0"
        @click="doBatchGrant"
      >
        确认发放 ({{ batchSelectedCount }})
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.coupon-info {
  margin-bottom: 4px;
}

.selected-area {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-items: center;
  min-height: 32px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
