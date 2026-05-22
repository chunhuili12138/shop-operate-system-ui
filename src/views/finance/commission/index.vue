<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getCommissionRules,
  addCommissionRule,
  updateCommissionRule,
  toggleCommissionRuleStatus,
  getCommissionSettlements,
  generateSettlement,
  paySettlement
} from "@/api/finance";
import { getDictData } from "@/api/dict";
import { getRoleList } from "@/api/system";

defineOptions({ name: "FinanceCommission" });

const activeTab = ref("rules");

// ---- 字典 ----
const ruleTypeDict = ref<any[]>([]);
const roleList = ref<any[]>([]);
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

// ---- 结算记录 ----
const settlements = ref([]);
const settlementsLoading = ref(false);
const settlementsPage = ref(1);
const settlementsSize = ref(20);
const settlementsTotal = ref(0);

// ---- 新增/编辑规则弹窗 ----
const ruleDialog = ref(false);
const isEditRule = ref(false);
const ruleForm = reactive({
  ruleId: 0,
  roleId: "",
  ruleType: 1,
  value: "",
  description: ""
});

const loadDicts = async () => {
  try {
    const r = await getDictData("commission_rule_type");
    if (r?.success && Array.isArray(r.data)) ruleTypeDict.value = r.data;
  } catch {
    /* ignore */
  }
  try {
    const rl = await getRoleList();
    if (rl?.success && Array.isArray(rl.data)) {
      roleList.value = rl.data.filter((r: any) => r.id !== 2 && r.id !== 3);
    }
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
    const r = await getCommissionSettlements({
      page: settlementsPage.value,
      size: settlementsSize.value
    });
    if (r?.success) {
      settlements.value = r.data.list;
      settlementsTotal.value = r.data.total;
    }
  } finally {
    settlementsLoading.value = false;
  }
};

const openAddRule = () => {
  isEditRule.value = false;
  Object.assign(ruleForm, {
    ruleId: 0,
    roleId: "",
    ruleType: 1,
    value: "",
    description: ""
  });
  ruleDialog.value = true;
};

const openEditRule = (row: any) => {
  isEditRule.value = true;
  Object.assign(ruleForm, {
    ruleId: row.id,
    roleId: String(row.role_id || ""),
    ruleType: row.rule_type,
    value: String(row.value || ""),
    description: row.description || ""
  });
  ruleDialog.value = true;
};

const saveRule = async () => {
  const data: any = {
    ruleId: ruleForm.ruleId,
    ruleType: ruleForm.ruleType,
    value: ruleForm.value,
    description: ruleForm.description
  };
  const r = isEditRule.value
    ? await updateCommissionRule(data)
    : await addCommissionRule({ roleId: ruleForm.roleId, ...data } as any);
  if (r?.success) {
    message(isEditRule.value ? "规则已更新" : "规则已添加", {
      type: "success"
    });
    ruleDialog.value = false;
    loadRules();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const toggleRule = async (row: any) => {
  const newActive = row.is_active === 1 ? 0 : 1;
  const r = await toggleCommissionRuleStatus(row.id, newActive);
  if (r?.success) {
    message(newActive ? "已启用" : "已禁用", { type: "success" });
    loadRules();
  } else message(r?.msg || "失败", { type: "warning" });
};

const onGenerateSettlement = async () => {
  const { value } = await ElMessageBox.prompt(
    "输入结算周期（如 2026-05）",
    "生成结算"
  );
  if (value) {
    const r = await generateSettlement({ settlementPeriod: value });
    if (r?.success) {
      message("结算已生成", { type: "success" });
      loadSettlements();
    } else message(r?.msg || "失败", { type: "warning" });
  }
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
    await loadSettlements();
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
          <el-table v-loading="rulesLoading" :data="rules" style="width: 100%">
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
        <el-button class="mb-2" @click="onGenerateSettlement"
          >生成结算</el-button
        >
        <div class="page-table">
          <el-table
            v-loading="settlementsLoading"
            :data="settlements"
            style="width: 100%"
          >
            <el-table-column prop="staff_name" label="员工" min-width="150" />
            <el-table-column prop="settlement_period" label="周期" min-width="120" />
            <el-table-column
              prop="total_sessions"
              label="次数"
              min-width="90"
              align="center"
            />
            <el-table-column prop="total_revenue" label="收入" width="90" />
            <el-table-column
              prop="commission_amount"
              label="提成金额"
              min-width="120"
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
            <el-table-column label="操作" width="80" fixed="right">
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

    <el-dialog
      v-model="ruleDialog"
      :title="isEditRule ? '编辑提成规则' : '新增提成规则'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item v-if="!isEditRule" label="角色" required>
          <el-select
            v-model="ruleForm.roleId"
            placeholder="选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="r in roleList"
              :key="r.id"
              :label="r.name"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="ruleForm.ruleType" style="width: 100%">
            <el-option
              v-for="d in ruleTypeDict"
              :key="d.dict_key"
              :label="d.dict_value"
              :value="d.dict_key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="值" required>
          <el-input
            v-model="ruleForm.value"
            :placeholder="
              ruleForm.ruleType === 1
                ? '每场提成金额'
                : ruleForm.ruleType === 2
                  ? '流水比例(%)'
                  : '固定金额'
            "
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ruleForm.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
