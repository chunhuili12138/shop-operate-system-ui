<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getCommissionRules,
  addCommissionRule,
  getCommissionSettlements,
  generateSettlement,
  paySettlement
} from "@/api/finance";

defineOptions({ name: "FinanceCommission" });

const activeTab = ref("rules");

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

// ---- 新增规则弹窗 ----
const ruleDialog = ref(false);
const ruleForm = reactive({
  roleId: "",
  ruleType: 1,
  value: "",
  description: ""
});

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
  ruleDialog.value = true;
  Object.assign(ruleForm, {
    roleId: "",
    ruleType: 1,
    value: "",
    description: ""
  });
};

const saveRule = async () => {
  const r = await addCommissionRule(ruleForm);
  if (r?.success) {
    message("规则已添加", { type: "success" });
    ruleDialog.value = false;
    loadRules();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const generateSettlement = async () => {
  const { value } = await import("element-plus").then(m =>
    m.ElMessageBox.prompt("输入结算周期（如 2026-05）", "生成结算")
  );
  if (value) {
    const r = await generateSettlement({ settlementPeriod: value });
    if (r?.success) {
      message("结算已生成", { type: "success" });
      loadSettlements();
    } else {
      message(r?.msg || "失败", { type: "warning" });
    }
  }
};

const paySettlement = async (id: number) => {
  const r = await paySettlement({ settlementId: id });
  if (r?.success) {
    message("提成已发放", { type: "success" });
    loadSettlements();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
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
  loadRules();
  loadSettlements();
});
</script>

<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="tab-layout">
      <!--======== 提成规则 ========-->
      <el-tab-pane label="提成规则" name="rules">
        <el-button class="mb-2" @click="openAddRule">新增规则</el-button>
        <div class="page-table">
          <el-table
            v-loading="rulesLoading"
            :data="rules"
                        style="width: 100%"
          >
            <el-table-column prop="role_name" label="角色" width="120" />
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                {{ ["", "按次", "流水比例", "固定金额"][row.rule_type] }}
              </template>
            </el-table-column>
            <el-table-column prop="value" label="值" />
            <el-table-column prop="description" label="描述" min-width="160" />
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

      <!--======== 结算记录 ========-->
      <el-tab-pane label="结算记录" name="settlements">
        <el-button class="mb-2" @click="generateSettlement">生成结算</el-button>
        <div class="page-table">
          <el-table
            v-loading="settlementsLoading"
            :data="settlements"
                        style="width: 100%"
          >
            <el-table-column prop="staff_name" label="员工" />
            <el-table-column prop="settlement_period" label="周期" width="100" />
            <el-table-column prop="total_sessions" label="次数" width="60" align="center" />
            <el-table-column prop="total_revenue" label="收入" width="100" />
            <el-table-column prop="commission_amount" label="提成金额" width="100" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'warning' : 'success'" size="small">
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
                  @click="paySettlement(row.id)"
                >
                  发放
                </el-button>
              </template>
            </el-table-column>
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

    <!-- 新增规则弹窗 -->
    <el-dialog
      v-model="ruleDialog"
      title="新增提成规则"
      width="480px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="角色ID">
          <el-input v-model="ruleForm.roleId" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="ruleForm.ruleType" style="width:100%">
            <el-option label="按次" :value="1" />
            <el-option label="流水比例" :value="2" />
            <el-option label="固定金额" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="值">
          <el-input v-model="ruleForm.value" />
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
