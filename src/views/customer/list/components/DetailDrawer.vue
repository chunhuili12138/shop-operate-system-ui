<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getCustomerInfo,
  getCustomerWallet,
  getCustomerPurchases,
  getCustomerPoints,
  adjustWallet,
  adjustPoints,
  rechargeWallet
} from "@/api/customer";
import { getAvailableCoupons, type AvailableCoupon } from "@/api/marketing";
import { getDictData } from "@/api/system";

const props = defineProps<{
  visible: boolean;
  customerId: number | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "refresh"): void;
}>();

const loading = ref(false);
const customer = ref<any>({});
const wallet = ref<any>({});
const transactions = ref<any[]>([]);
const purchases = ref<any[]>([]);
const purchasesTotal = ref(0);
const purchasesPage = ref(1);
const pointsList = ref<any[]>([]);
const pointsTotal = ref(0);
const pointsPage = ref(1);
const activeTab = ref("purchases");

// 充值弹窗
const rechargeVisible = ref(false);
const rechargeAmount = ref(0);
const rechargeCoupons = ref<AvailableCoupon[]>([]);
const rechargeCouponId = ref<number | undefined>(undefined);
const rechargeDiscount = ref(0);
const rechargeLoading = ref(false);

const pageSize = 20;
const sourceOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);
const channelOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);
const payMethodOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

const sourceLabel = (key: string) => {
  const found = sourceOptions.value.find(s => s.dict_label === key);
  return found?.dict_value || key || "-";
};
const channelLabel = (key: string) => {
  const found = channelOptions.value.find(s => s.dict_label === key);
  return found?.dict_value || key || "-";
};
const payMethodLabel = (key: string) => {
  const found = payMethodOptions.value.find(s => s.dict_label === key);
  return found?.dict_value || key || "-";
};
const purchaseTypeLabel = (key: string) => {
  return key === "recharge" ? "充值" : "购买套餐";
};

onMounted(async () => {
  const [srcR, chR, pmR] = await Promise.all([
    getDictData({ dictCode: "customer_source" }),
    getDictData({ dictCode: "purchase_channel" }),
    getDictData({ dictCode: "payment_method" })
  ]);
  if (srcR?.success && Array.isArray(srcR.data))
    sourceOptions.value = srcR.data;
  if (chR?.success && Array.isArray(chR.data)) channelOptions.value = chR.data;
  if (pmR?.success && Array.isArray(pmR.data))
    payMethodOptions.value = pmR.data;
});

watch(
  () => props.visible,
  async v => {
    if (v && props.customerId) {
      await loadAll();
    }
  }
);

const loadAll = async () => {
  if (!props.customerId) return;
  loading.value = true;
  try {
    const [infoR, walletR] = await Promise.all([
      getCustomerInfo(props.customerId),
      getCustomerWallet(props.customerId)
    ]);
    if (infoR?.success) customer.value = infoR.data;
    if (walletR?.success) {
      wallet.value = walletR.data;
      transactions.value = walletR.data?.transactions || [];
    }
    await Promise.all([loadPurchases(), loadPoints()]);
  } finally {
    loading.value = false;
  }
};

const loadPurchases = async () => {
  if (!props.customerId) return;
  const r = await getCustomerPurchases(
    props.customerId,
    purchasesPage.value,
    pageSize
  );
  if (r?.success) {
    purchases.value = r.data?.list || [];
    purchasesTotal.value = r.data?.total || 0;
  }
};

const loadPoints = async () => {
  if (!props.customerId) return;
  const r = await getCustomerPoints(
    props.customerId,
    pointsPage.value,
    pageSize
  );
  if (r?.success) {
    pointsList.value = r.data?.list || [];
    pointsTotal.value = r.data?.total || 0;
  }
};

const onPurchasesPageChange = (p: number) => {
  purchasesPage.value = p;
  loadPurchases();
};

const onPointsPageChange = (p: number) => {
  pointsPage.value = p;
  loadPoints();
};

const adjWallet = (type: number) => {
  ElMessageBox.prompt(
    type === 1 ? "请输入充值金额" : "请输入扣减金额",
    type === 1 ? "钱包充值" : "钱包扣减",
    { inputType: "number", inputValidator: (v: string) => v && Number(v) > 0 }
  )
    .then(async ({ value }: any) => {
      const r = await adjustWallet({
        customersId: props.customerId!,
        type,
        amount: value,
        remark: type === 1 ? "手动充值" : "手动扣减"
      });
      if (r?.success) {
        message("调整成功", { type: "success" });
        await loadAll();
      } else {
        message(r?.msg || "调整失败", { type: "warning" });
      }
    })
    .catch(() => {});
};

const openRecharge = async () => {
  rechargeAmount.value = 0;
  rechargeCouponId.value = undefined;
  rechargeDiscount.value = 0;
  rechargeCoupons.value = [];
  rechargeVisible.value = true;
  // 加载该顾客可用的充值券
  try {
    const r = await getAvailableCoupons({
      customerId: props.customerId!,
      scene: "recharge"
    } as any);
    if (r?.success && Array.isArray(r.data))
      rechargeCoupons.value = r.data as any;
  } catch {
    /* ignore */
  }
};

const onRechargeCouponChange = (id: number | undefined) => {
  if (!id) {
    rechargeDiscount.value = 0;
    return;
  }
  const c = rechargeCoupons.value.find(cu => cu.coupon_usage_id === id);
  if (!c) return;
  const amt = rechargeAmount.value || 0;
  let d = 0;
  if (c.type === 1) d = Math.min(Number(c.value), amt);
  else if (c.type === 2) d = (amt * Number(c.value)) / 100;
  else if (c.type === 3) d = amt;
  rechargeDiscount.value = d;
};

const onRechargeAmountChange = () => {
  // 金额变化后，检查已选券是否仍满足最低消费
  if (rechargeCouponId.value) {
    const c = rechargeCoupons.value.find(
      cu => cu.coupon_usage_id === rechargeCouponId.value
    );
    const min = Number(c?.min_order_amount) || 0;
    if (min > 0 && rechargeAmount.value < min) {
      rechargeCouponId.value = undefined;
      rechargeDiscount.value = 0;
    } else {
      onRechargeCouponChange(rechargeCouponId.value);
    }
  }
};

const doRecharge = async () => {
  if (rechargeAmount.value <= 0) {
    message("请输入充值金额", { type: "warning" });
    return;
  }
  // 前端校验：选券时检查最低消费
  if (rechargeCouponId.value) {
    const c = rechargeCoupons.value.find(
      cu => cu.coupon_usage_id === rechargeCouponId.value
    );
    if (c) {
      const min = Number(c.min_order_amount) || 0;
      if (min > 0 && rechargeAmount.value < min) {
        message(`充值金额不满足优惠券最低消费要求（需≥${min}元）`, {
          type: "warning"
        });
        return;
      }
    }
  }
  rechargeLoading.value = true;
  try {
    const r = await rechargeWallet({
      customersId: props.customerId!,
      amount: rechargeAmount.value,
      couponUsageId: rechargeCouponId.value,
      paymentMethod: "other",
      remark: rechargeCouponId.value
        ? `充值¥${rechargeAmount.value}（优惠抵扣¥${rechargeDiscount.value}）`
        : `充值¥${rechargeAmount.value}`
    });
    if (r?.success) {
      message("充值成功", { type: "success" });
      rechargeVisible.value = false;
      await loadAll();
    } else {
      message(r?.msg || "充值失败", { type: "warning" });
    }
  } catch {
    message("网络异常", { type: "error" });
  } finally {
    rechargeLoading.value = false;
  }
};

const adjPoints = () => {
  ElMessageBox.prompt("输入积分数量（正数增加，负数扣减）", "积分调整", {
    inputType: "number"
  })
    .then(async ({ value }: any) => {
      const r = await adjustPoints({
        customersId: props.customerId!,
        points: parseInt(value),
        remark: "手动调整"
      });
      if (r?.success) {
        message("调整成功", { type: "success" });
        loadAll();
      } else {
        message(r?.msg || "调整失败", { type: "warning" });
      }
    })
    .catch(() => {});
};

const genderMap: Record<number, string> = { 1: "男", 2: "女" };
const walletTypeMap: Record<number, string> = {
  1: "充值",
  2: "消费",
  3: "退款",
  4: "调整"
};
const purchaseStatusMap: Record<number, string> = {
  1: "有效",
  2: "已退款",
  3: "已过期"
};
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="顾客详情"
    size="1000px"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="customer">
      <!-- 基本信息区 -->
      <div class="mb-4 flex items-start gap-4">
        <el-avatar
          :size="56"
          :src="
            customer.avatar_url
              ? customer.avatar_url.startsWith('http')
                ? customer.avatar_url
                : `/api/file/image?name=${encodeURIComponent(customer.avatar_url)}`
              : undefined
          "
        />
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg font-semibold">{{
              customer.nickname || "-"
            }}</span>
            <el-tag v-if="customer.wechat_openid" size="small" type="success"
              >微信</el-tag
            >
          </div>
          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="手机号">{{
              customer.phone || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{
              genderMap[customer.gender] || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{
              sourceLabel(customer.source)
            }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{
              customer.created_at || "-"
            }}</el-descriptions-item>
            <el-descriptions-item v-if="customer.tags" label="标签" :span="2">{{
              customer.tags
            }}</el-descriptions-item>
            <el-descriptions-item
              v-if="customer.remark"
              label="备注"
              :span="2"
              >{{ customer.remark }}</el-descriptions-item
            >
          </el-descriptions>
        </div>
      </div>

      <el-divider />

      <!-- 钱包卡片 -->
      <div
        class="rounded-lg border border-[var(--el-border-color-light)] p-4 mb-4"
      >
        <div class="text-sm font-medium mb-3">钱包</div>
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center">
            <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">
              余额
            </div>
            <div
              class="text-2xl font-bold"
              style="color: var(--el-color-primary)"
            >
              ¥{{ wallet?.balance || 0 }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">
              累计充值
            </div>
            <div class="text-lg font-medium">
              ¥{{ wallet?.total_recharged || 0 }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">
              累计消费
            </div>
            <div class="text-lg font-medium">
              ¥{{ wallet?.total_spent || 0 }}
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <el-button size="small" type="primary" @click="openRecharge"
            >充值</el-button
          >
          <el-button size="small" type="warning" plain @click="adjWallet(4)"
            >扣减</el-button
          >
        </div>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab">
        <!-- 购买记录 Tab -->
        <el-tab-pane label="购买记录" name="purchases">
          <el-table v-if="purchases.length" :data="purchases" size="small">
            <el-table-column label="类型" width="80" align="center">
              <template #default="{ row }">{{
                purchaseTypeLabel(row.purchase_type)
              }}</template>
            </el-table-column>
            <el-table-column prop="package_name" label="套餐" min-width="100">
              <template #default="{ row }">{{
                row.package_name || "-"
              }}</template>
            </el-table-column>
            <el-table-column
              prop="total_amount"
              label="金额"
              width="90"
              align="right"
            >
              <template #default="{ row }">¥{{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column label="优惠" width="80" align="right">
              <template #default="{ row }">
                <span
                  v-if="row.coupon_discount > 0"
                  style="color: var(--el-color-danger)"
                  >-¥{{ row.coupon_discount }}</span
                >
                <span v-else style="color: #909399">-</span>
              </template>
            </el-table-column>
            <el-table-column label="实付" width="90" align="right">
              <template #default="{ row }">
                <span style="font-weight: 600">¥{{ row.paid_amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" width="90" align="center">
              <template #default="{ row }">{{
                payMethodLabel(row.payment_method)
              }}</template>
            </el-table-column>
            <el-table-column label="渠道" width="80" align="center">
              <template #default="{ row }">{{
                channelLabel(row.channel)
              }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="155" />
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.status === 1
                      ? 'success'
                      : row.status === 2
                        ? 'warning'
                        : 'info'
                  "
                  size="small"
                >
                  {{ purchaseStatusMap[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无购买记录" :image-size="60" />
          <el-pagination
            v-if="purchasesTotal > pageSize"
            small
            layout="prev, pager, next"
            :total="purchasesTotal"
            :page-size="pageSize"
            :current-page="purchasesPage"
            class="mt-3"
            @current-change="onPurchasesPageChange"
          />
        </el-tab-pane>

        <!-- 钱包流水 Tab -->
        <el-tab-pane label="钱包流水" name="transactions">
          <el-table
            v-if="transactions.length"
            :data="transactions"
            size="small"
          >
            <el-table-column label="类型" width="70">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.type === 1
                      ? 'success'
                      : row.type === 3
                        ? 'warning'
                        : 'info'
                  "
                  size="small"
                >
                  {{ walletTypeMap[row.type] || row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="100">
              <template #default="{ row }">
                <span
                  :style="{
                    color:
                      row.type === 1 || row.type === 3
                        ? 'var(--el-color-success)'
                        : 'var(--el-color-danger)'
                  }"
                >
                  {{ row.type === 1 || row.type === 3 ? "+" : "-" }}¥{{
                    row.amount
                  }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="balance_after" label="余额" width="100">
              <template #default="{ row }">¥{{ row.balance_after }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="100" />
            <el-table-column prop="created_at" label="时间" width="160" />
          </el-table>
          <el-empty v-else description="暂无交易流水" :image-size="60" />
        </el-tab-pane>

        <!-- 积分记录 Tab -->
        <el-tab-pane label="积分记录" name="points">
          <div class="mb-3 flex items-center gap-2">
            <el-button size="small" type="primary" @click="adjPoints"
              >积分调整</el-button
            >
          </div>
          <el-table v-if="pointsList.length" :data="pointsList" size="small">
            <el-table-column prop="points" label="积分变动" width="90">
              <template #default="{ row }">
                <span
                  :style="{
                    color:
                      row.points > 0
                        ? 'var(--el-color-success)'
                        : 'var(--el-color-danger)'
                  }"
                >
                  {{ row.points > 0 ? "+" : "" }}{{ row.points }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="balance_after" label="积分余额" width="90" />
            <el-table-column prop="source" label="来源" width="80" />
            <el-table-column prop="remark" label="说明" min-width="100" />
            <el-table-column prop="created_at" label="时间" width="160" />
          </el-table>
          <el-empty v-else description="暂无积分记录" :image-size="60" />
          <el-pagination
            v-if="pointsTotal > pageSize"
            small
            layout="prev, pager, next"
            :total="pointsTotal"
            :page-size="pageSize"
            :current-page="pointsPage"
            class="mt-3"
            @current-change="onPointsPageChange"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- 充值弹窗 -->
      <el-dialog
        v-model="rechargeVisible"
        title="钱包充值"
        width="480px"
        :close-on-click-modal="false"
      >
        <el-form label-width="100px">
          <el-form-item label="充值金额">
            <el-input-number
              v-model="rechargeAmount"
              :min="0"
              :precision="2"
              style="width: 100%"
              @change="onRechargeAmountChange"
            />
          </el-form-item>
          <el-form-item v-if="rechargeCoupons.length > 0" label="优惠券">
            <el-select
              v-model="rechargeCouponId"
              clearable
              placeholder="不使用优惠券"
              style="width: 100%"
              @change="onRechargeCouponChange"
            >
              <el-option
                v-for="cu in rechargeCoupons"
                :key="cu.coupon_usage_id"
                :label="
                  cu.name +
                  ' (抵¥' +
                  (cu.type === 1
                    ? cu.value
                    : cu.type === 2
                      ? ((rechargeAmount * Number(cu.value)) / 100).toFixed(2)
                      : rechargeAmount.toFixed(2)) +
                  (Number(cu.min_order_amount) > 0
                    ? ', 满¥' + cu.min_order_amount
                    : '') +
                  ')'
                "
                :value="cu.coupon_usage_id"
                :disabled="
                  Number(cu.min_order_amount) > 0 &&
                  rechargeAmount < Number(cu.min_order_amount)
                "
              />
            </el-select>
          </el-form-item>
          <el-divider />
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="充值金额"
              >¥{{ rechargeAmount.toFixed(2) }}</el-descriptions-item
            >
            <el-descriptions-item v-if="rechargeDiscount > 0" label="优惠抵扣">
              <span style=" font-weight: 700;color: var(--el-color-danger)"
                >-¥{{ rechargeDiscount.toFixed(2) }}</span
              >
            </el-descriptions-item>
            <el-descriptions-item label="实收金额">
              <span style=" font-size: 16px;font-weight: 700"
                >¥{{ (rechargeAmount - rechargeDiscount).toFixed(2) }}</span
              >
            </el-descriptions-item>
            <el-descriptions-item label="钱包到账">
              <span
                style="
                  font-size: 16px;
                  font-weight: 700;
                  color: var(--el-color-success);
                "
                >¥{{ rechargeAmount.toFixed(2) }}</span
              >
            </el-descriptions-item>
          </el-descriptions>
        </el-form>
        <template #footer>
          <el-button @click="rechargeVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="rechargeLoading"
            @click="doRecharge"
            >确认充值</el-button
          >
        </template>
      </el-dialog>
    </template>
  </el-drawer>
</template>
