<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "@/utils/message";
import { getSeatList, addSeat, renewSeat, deleteSeat } from "@/api/tenant";
import { getDictData } from "@/api/system";

const props = defineProps<{
  visible: boolean;
  staffId: number;
}>();

const emit = defineEmits(["update:visible", "refresh"]);

const seatDialog = ref(false);
const seats = ref([]);
const seatAddDialog = ref(false);
const seatForm = reactive({
  staffId: 0,
  subscriptionType: 1,
  subscriptionNum: 1,
  amount: 0,
  paymentMethod: ""
});
const seatRenewDialog = ref(false);
const seatRenewForm = reactive({
  seatId: "",
  subscriptionType: 1,
  subscriptionNum: 1,
  amount: 0,
  paymentMethod: ""
});

// 字典
const paymentMethods = ref([] as any[]);
const loadPaymentMethods = async () => {
  try {
    const r = await getDictData({ dictCode: "payment_method" });
    if (r?.success) paymentMethods.value = r.data || [];
  } catch {
    /* ignore */
  }
};

const openSeat = async () => {
  const r = await getSeatList(props.staffId);
  if (r?.success) seats.value = r.data || [];
  seatDialog.value = true;
};

const openSeatAdd = () => {
  Object.assign(seatForm, {
    staffId: props.staffId,
    subscriptionType: 1,
    subscriptionNum: 1,
    amount: "",
    paymentMethod: ""
  });
  seatAddDialog.value = true;
};

const doSeatAdd = async () => {
  const r = await addSeat(seatForm);
  if (r?.success) {
    message("席位已添加", { type: "success" });
    seatAddDialog.value = false;
    openSeat();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openSeatRenew = (row: any) => {
  Object.assign(seatRenewForm, {
    seatId: row.id,
    subscriptionType: 1,
    subscriptionNum: 1,
    amount: "",
    paymentMethod: ""
  });
  seatRenewDialog.value = true;
};

const doSeatRenew = async () => {
  const r = await renewSeat(seatRenewForm);
  if (r?.success) {
    message("续订成功", { type: "success" });
    seatRenewDialog.value = false;
    openSeat();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const doSeatDel = async (id: number) => {
  await import("element-plus").then(m =>
    m.ElMessageBox.confirm("确认删除？", "提示")
  );
  const r = await deleteSeat(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    openSeat();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const handleClose = () => {
  emit("update:visible", false);
};

defineExpose({
  openSeat
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="席位管理"
    width="750px"
    class="dialog-lg"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template #header>
      <div class="flex-bc">
        <span>席位管理</span>
        <el-button size="small" type="primary" @click="openSeatAdd">
          新增席位
        </el-button>
      </div>
    </template>
    <el-table :data="seats" style="width: 100%">
      <el-table-column prop="start_date" label="生效" width="120" />
      <el-table-column prop="end_date" label="到期" width="120" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? "生效中" : "已到期" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="shop_names" label="关联店铺" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 1"
            link
            type="primary"
            @click="openSeatRenew(row)"
          >
            续订
          </el-button>
          <el-button link type="danger" @click="doSeatDel(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <!-- 新增席位 -->
  <el-dialog
    v-model="seatAddDialog"
    title="新增席位"
    width="440px"
    class="dialog-sm"
    :close-on-click-modal="false"
  >
    <el-form :model="seatForm" label-width="100px">
      <el-form-item label="类型">
        <el-select v-model="seatForm.subscriptionType" style="width: 100%">
          <el-option label="月付" :value="1" />
          <el-option label="年付" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number
          v-model="seatForm.subscriptionNum"
          :min="1"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="金额">
        <el-input-number
          v-model="seatForm.amount"
          :min="0"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="支付方式">
        <el-select
          v-model="seatForm.paymentMethod"
          style="width: 100%"
          clearable
        >
          <el-option
            v-for="pm in paymentMethods"
            :key="pm.dict_key"
            :label="pm.dict_value"
            :value="pm.dict_label"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="seatAddDialog = false">取消</el-button>
      <el-button type="primary" @click="doSeatAdd">保存</el-button>
    </template>
  </el-dialog>

  <!-- 续订席位 -->
  <el-dialog
    v-model="seatRenewDialog"
    title="续订席位"
    width="440px"
    class="dialog-sm"
    :close-on-click-modal="false"
  >
    <el-form :model="seatRenewForm" label-width="100px">
      <el-form-item label="类型">
        <el-select
          v-model="seatRenewForm.subscriptionType"
          style="width: 100%"
        >
          <el-option label="月付" :value="1" />
          <el-option label="年付" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number
          v-model="seatRenewForm.subscriptionNum"
          :min="1"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="金额">
        <el-input-number
          v-model="seatRenewForm.amount"
          :min="0"
          :precision="2"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="支付方式">
        <el-select
          v-model="seatRenewForm.paymentMethod"
          style="width: 100%"
          clearable
        >
          <el-option
            v-for="pm in paymentMethods"
            :key="pm.dict_key"
            :label="pm.dict_value"
            :value="pm.dict_label"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="seatRenewDialog = false">取消</el-button>
      <el-button type="primary" @click="doSeatRenew">保存</el-button>
    </template>
  </el-dialog>
</template>
