<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { addPurchase, type AddPurchaseParams } from "@/api/trade";
import { getCustomerList, getCustomerWallet } from "@/api/customer";
import { getPackageList } from "@/api/package";
import { getDictData } from "@/api/dict";

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const customers = ref<any[]>([]);
const packages = ref<any[]>([]);
const channelOptions = ref<any[]>([]);
const paymentMethodOptions = ref<any[]>([]);
const walletInfo = ref<{ balance: number; total_recharged: number } | null>(null);
const walletLoading = ref(false);

const form = reactive<AddPurchaseParams>({
  customersId: 0,
  packageId: 0,
  channel: "store",
  paymentType: "direct",
  paymentMethod: "",
  totalAmount: 0,
  paidAmount: 0,
  thirdPartyCouponCode: "",
  remark: ""
});

const rules = computed<FormRules>(() => ({
  customersId: [{ required: true, message: "请选择顾客", trigger: "change" }],
  packageId: [{ required: true, message: "请选择套餐", trigger: "change" }],
  paymentMethod: form.paymentType === "direct"
    ? [{ required: true, message: "请选择支付方式", trigger: "change" }]
    : [],
  totalAmount: [{ required: true, message: "请输入金额", trigger: "blur" }],
  thirdPartyCouponCode: form.paymentType === "coupon"
    ? [{ required: true, message: "请输入第三方券码", trigger: "blur" }]
    : []
}));

const loadDicts = async () => {
  try {
    const [chRes, pmRes] = await Promise.all([
      getDictData("purchase_channel"),
      getDictData("payment_method")
    ]);
    if (chRes?.success && Array.isArray(chRes.data)) channelOptions.value = chRes.data;
    if (pmRes?.success && Array.isArray(pmRes.data)) paymentMethodOptions.value = pmRes.data;
  } catch { /* 降级 */ }
};

const loadCustomers = async (keyword?: string) => {
  try {
    const r = await getCustomerList({ page: 1, size: 100, keyword });
    if (r?.success) customers.value = r.data?.list || [];
  } catch { /* ignore */ }
};

const loadPackages = async (keyword?: string) => {
  try {
    const r = await getPackageList({ page: 1, size: 100, keyword });
    if (r?.success) packages.value = r.data?.list || [];
  } catch { /* ignore */ }
};

const onCustomerChange = async (customerId: number) => {
  walletInfo.value = null;
  if (!customerId) return;
  walletLoading.value = true;
  try {
    const r = await getCustomerWallet(customerId);
    if (r?.success && r.data) walletInfo.value = r.data;
  } catch { /* ignore */ }
  finally { walletLoading.value = false; }
};

const onPackageChange = (packageId: number) => {
  const pkg = packages.value.find((p: any) => p.id === packageId);
  if (pkg) {
    form.totalAmount = parseFloat(pkg.price) || 0;
    if (form.paymentType === "wallet") form.paidAmount = form.totalAmount;
  }
};

const resetForm = () => {
  Object.assign(form, {
    customersId: 0,
    packageId: 0,
    channel: "store",
    paymentType: "direct",
    paymentMethod: "",
    totalAmount: 0,
    paidAmount: 0,
    thirdPartyCouponCode: "",
    remark: ""
  });
  walletInfo.value = null;
  formRef.value?.clearValidate();
};

const handleClose = () => emit("update:visible", false);

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (form.paymentType === "wallet" && walletInfo.value && walletInfo.value.balance < form.totalAmount) {
    message("钱包余额不足", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    const r = await addPurchase({ ...form });
    if (r?.success) {
      message("购买成功", { type: "success" });
      emit("update:visible", false);
      emit("success");
    } else {
      message(r?.msg || "购买失败", { type: "warning" });
    }
  } catch {
    message("网络异常", { type: "error" });
  } finally {
    loading.value = false;
  }
};

watch(() => props.visible, (val) => {
  if (val) {
    resetForm();
    loadCustomers();
    loadPackages();
    loadDicts();
  }
});

watch(() => form.paymentType, () => {
  formRef.value?.clearValidate();
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="新增购买"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="顾客" prop="customersId">
        <el-select
          v-model="form.customersId"
          filterable
          remote
          reserve-keyword
          :remote-method="loadCustomers"
          placeholder="搜索顾客姓名/手机号"
          style="width:100%"
          @change="onCustomerChange"
        >
          <el-option v-for="c in customers" :key="c.id" :label="c.nickname + ' (' + c.phone + ')'" :value="c.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="套餐" prop="packageId">
        <el-select v-model="form.packageId" filterable placeholder="选择套餐" style="width:100%" @change="onPackageChange">
          <el-option v-for="p in packages" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="支付类型" prop="paymentType">
        <el-radio-group v-model="form.paymentType">
          <el-radio-button value="direct">直接付款</el-radio-button>
          <el-radio-button value="wallet">储值钱包</el-radio-button>
          <el-radio-button value="coupon">第三方券码</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.paymentType === 'wallet'">
        <el-form-item label="钱包余额">
          <span v-if="walletLoading" style="color:#909399">加载中...</span>
          <span v-else-if="walletInfo" :style="{ color: walletInfo.balance < form.totalAmount ? '#f56c6c' : '#67c23a', fontWeight: 700 }">
            ¥{{ walletInfo.balance.toFixed(2) }}
            <span v-if="walletInfo.balance < form.totalAmount" style="color:#f56c6c;font-size:12px">（余额不足）</span>
          </span>
          <span v-else style="color:#909399">未开通钱包</span>
        </el-form-item>
      </template>

      <template v-if="form.paymentType === 'direct'">
        <el-form-item label="渠道">
          <el-select v-model="form.channel" style="width:100%">
            <el-option v-for="c in channelOptions" :key="c.dict_label" :label="c.dict_value" :value="c.dict_label" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="form.paymentMethod" style="width:100%">
            <el-option v-for="m in paymentMethodOptions" :key="m.dict_label" :label="m.dict_value" :value="m.dict_label" />
          </el-select>
        </el-form-item>
        <el-form-item label="总金额" prop="totalAmount">
          <el-input v-model.number="form.totalAmount" placeholder="0.00" />
        </el-form-item>
        <el-form-item label="实付">
          <el-input v-model.number="form.paidAmount" placeholder="0.00" />
        </el-form-item>
      </template>

      <template v-if="form.paymentType === 'wallet'">
        <el-form-item label="扣款金额" prop="totalAmount">
          <el-input v-model.number="form.totalAmount" placeholder="0.00" />
        </el-form-item>
      </template>

      <template v-if="form.paymentType === 'coupon'">
        <el-form-item label="来源渠道">
          <el-select v-model="form.channel" style="width:100%">
            <el-option v-for="c in channelOptions" :key="c.dict_label" :label="c.dict_value" :value="c.dict_label" />
          </el-select>
        </el-form-item>
        <el-form-item label="第三方券码" prop="thirdPartyCouponCode">
          <el-input v-model="form.thirdPartyCouponCode" placeholder="输入美团/抖音券码" />
        </el-form-item>
        <el-form-item label="金额" prop="totalAmount">
          <el-input v-model.number="form.totalAmount" placeholder="0.00" />
        </el-form-item>
      </template>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" placeholder="可选备注" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSave">确认购买</el-button>
    </template>
  </el-dialog>
</template>
