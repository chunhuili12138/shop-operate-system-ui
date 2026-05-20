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
  adjustPoints
} from "@/api/customer";
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

const pageSize = 20;
const sourceOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);

const sourceLabel = (key: string) => {
  const found = sourceOptions.value.find(s => s.dict_label === key);
  return found?.dict_value || key || "-";
};

onMounted(async () => {
  const r = await getDictData({ dictCode: "customer_source" });
  if (r?.success && Array.isArray(r.data)) {
    sourceOptions.value = r.data;
  }
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
    size="720px"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="customer">
      <!-- 基本信息区 -->
      <div class="mb-4 flex items-start gap-4">
        <el-avatar :size="56" :src="customer.avatar_url" />
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
          <el-button size="small" type="primary" @click="adjWallet(1)"
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
            <el-table-column prop="package_name" label="套餐" min-width="120" />
            <el-table-column prop="total_amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column prop="channel" label="渠道" width="80" />
            <el-table-column prop="created_at" label="时间" width="160" />
            <el-table-column label="状态" width="80">
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
    </template>
  </el-drawer>
</template>
