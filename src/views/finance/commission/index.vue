<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getCommissionRules,
  toggleCommissionRuleStatus,
  getCommissionSettlements,
  paySettlement
} from "@/api/finance";
import { getDictData } from "@/api/dict";
import CommissionRuleDialog from "./components/CommissionRuleDialog.vue";
import SettlementGenerateDialog from "./components/SettlementGenerateDialog.vue";

defineOptions({ name: "FinanceCommission" });

const activeTab = ref("rules");

// ---- 字典 ----
const ruleTypeDict = ref<any[]>([]);
const ruleTypeLabel = (type: number) => {
  const item = ruleTypeDict.value.find((d: any) => d.dict_key === type);
  return item ? item.dict_value : String(type);
};

// ---- 提成规则 ----
const rules = ref([]);
const rulesLoading = ref(false);
const rulesPage = ref(1);
const rulesSize = ref(20);
const rulesTotal = ref(0);
const ruleDialogVisible = ref(false);
const currentRule = ref<any>(null);

// ---- 结算记录 ----
const settlements = ref([]);
const settlementsLoading = ref(false);
const settlementsPage = ref(1);
const settlementsSize = ref(20);
const settlementsTotal = ref(0);
const settleDialogVisible = ref(false);
const settleQueryPeriod = ref("");

const loadDicts = async () => {
  try {
    const r = await getDictData("commission_rule_type");
    if (r?.success && Array.isArray(r.data)) ruleTypeDict.value = r.data;
  } catch {
    /* ignore */
  }
};

const loadRules = async () => {
  rulesLoading.value = true;
  try {
    const r = await getCommissionRules({
      page: rulesPage.value,
      size: rulesSize.value
    });
    if (r?.success) {
      rules.value = r.data.list;
      rulesTotal.value = r.data.total;
    }
  } finally {
    rulesLoading.value = false;
  }
};

const loadSettlements = async () => {
  settlementsLoading.value = true;
  try {
    const params: any = {
      page: settlementsPage.value,
      size: settlementsSize.value
    };
    if (settleQueryPeriod.value)
      params.settlementPeriod = settleQueryPeriod.value;
    const r = await getCommissionSettlements(params);
    if (r?.success) {
      settlements.value = r.data.list;
      settlementsTotal.value = r.data.total;
    }
  } finally {
    settlementsLoading.value = false;
  }
};

const openAddRule = () => {
  currentRule.value = null;
  ruleDialogVisible.value = true;
};
const openEditRule = (row: any) => {
  currentRule.value = row;
  ruleDialogVisible.value = true;
};

const toggleRule = async (row: any) => {
  const newActive = row.is_active === 1 ? 0 : 1;
  const r = await toggleCommissionRuleStatus(row.id, newActive);
  if (r?.success) {
    message(newActive ? "已启用" : "已禁用", { type: "success" });
    loadRules();
  } else message(r?.msg || "失败", { type: "warning" });
};

const onPaySettlement = async (id: number) => {
  try {
    await ElMessageBox.confirm("确认发放提成？", "提示", { type: "warning" });
  } catch {
    return;
  }
  const r = await paySettlement({ settlementId: id });
  if (r?.success) {
    message("提成已发放", { type: "success" });
    loadSettlements();
  } else message(r?.msg || "失败", { type: "warning" });
};

const onRuleSizeChange = (s: number) => {
  rulesSize.value = s;
  rulesPage.value = 1;
  loadRules();
};
const onSettlementSizeChange = (s: number) => {
  settlementsSize.value = s;
  settlementsPage.value = 1;
  loadSettlements();
};

onMounted(() => {
  loadDicts();
  loadRules();
  loadSettlements();
});
</script>

<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="tab-layout">
      <el-tab-pane label="提成规则" name="rules">
        <el-button class="mb-2" @click="openAddRule">新增规则</el-button>
        <div class="page-table">
          <el-table
            v-loading="rulesLoading"
            :data="rules"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="role_name" label="角色" width="120" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">{{
                ruleTypeLabel(row.rule_type)
              }}</template>
            </el-table-column>
            <el-table-column prop="value" label="值" width="100" />
            <el-table-column prop="description" label="描述" min-width="140" />
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.is_active ? 'success' : 'info'"
                  size="small"
                  >{{ row.is_active ? "启用" : "禁用" }}</el-tag
                >
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="openEditRule(row)"
                  >编辑</el-button
                >
                <el-button
                  link
                  :type="row.is_active ? 'warning' : 'success'"
                  size="small"
                  @click="toggleRule(row)"
                >
                  {{ row.is_active ? "禁用" : "启用" }}
                </el-button>
              </template>
            </el-table-column>
            <template #empty><el-empty description="暂无提成规则" /></template>
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="rulesPage"
          v-model:page-size="rulesSize"
          :total="rulesTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          class="page-pagination"
          @size-change="onRuleSizeChange"
          @current-change="loadRules"
        />
      </el-tab-pane>

      <el-tab-pane label="结算记录" name="settlements">
        <div
          style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          "
        >
          <el-date-picker
            v-model="settleQueryPeriod"
            type="month"
            value-format="YYYY-MM"
            placeholder="全部周期"
            clearable
            style="width: 170px"
            @change="((settlementsPage = 1), loadSettlements())"
          />
          <el-button type="primary" @click="settleDialogVisible = true"
            >生成结算</el-button
          >
        </div>
        <div class="page-table">
          <el-table
            v-loading="settlementsLoading"
            :data="settlements"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="staff_name" label="员工" min-width="150" />
            <el-table-column
              prop="settlement_period"
              label="周期"
              min-width="130"
            />
            <el-table-column
              prop="total_sessions"
              label="次数"
              min-width="100"
              align="center"
            />
            <el-table-column
              prop="total_revenue"
              label="收入"
              min-width="130"
            />
            <el-table-column
              prop="commission_amount"
              label="提成金额"
              min-width="130"
            />
            <el-table-column label="状态" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 1 ? 'warning' : 'success'"
                  size="small"
                >
                  {{ row.status === 1 ? "待结算" : "已发放" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 1"
                  link
                  type="primary"
                  @click="onPaySettlement(row.id)"
                  >发放</el-button
                >
              </template>
            </el-table-column>
            <template #empty><el-empty description="暂无结算记录" /></template>
          </el-table>
        </div>
        <el-pagination
          v-model:current-page="settlementsPage"
          v-model:page-size="settlementsSize"
          :total="settlementsTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          class="page-pagination"
          @size-change="onSettlementSizeChange"
          @current-change="loadSettlements"
        />
      </el-tab-pane>
    </el-tabs>

    <CommissionRuleDialog
      v-model:visible="ruleDialogVisible"
      :rule-data="currentRule"
      @success="loadRules"
    />
    <SettlementGenerateDialog
      v-model:visible="settleDialogVisible"
      @success="loadSettlements"
    />
  </div>
</template>
