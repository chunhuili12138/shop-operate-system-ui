<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { message } from "@/utils/message";
import { addCoupon, updateCoupon } from "@/api/marketing";
import { getDictData } from "@/api/dict";
import type { FormInstance, FormRules } from "element-plus";

defineOptions({ name: "CouponFormDialog" });

const props = defineProps<{
  visible: boolean;
  editRow: any | null;
}>();
const emit = defineEmits<{ (e: "update:visible", v: boolean): void; (e: "submit"): void }>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const typeOptions = ref<{ dict_key: number; dict_value: string; dict_label: string }[]>([]);

const form = reactive({
  couponId: null as number | null,
  name: "",
  type: 1,
  value: "",
  minOrderAmount: "0",
  totalStock: 0,
  perUserLimit: 1,
  validDays: 30,
  autoGrantOnRegister: 0
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入优惠券名称", trigger: "blur" }],
  value: [
    { required: true, message: "请输入面值", trigger: "blur" },
    {
      validator: (_r, v, cb) =>
        v !== "" && Number(v) >= 0 ? cb() : cb(new Error("面值不能为负")),
      trigger: "blur"
    }
  ],
  validDays: [
    { required: true, message: "请输入有效期", trigger: "blur" },
    {
      validator: (_r, v, cb) => (v > 0 ? cb() : cb(new Error("有效期必须大于0"))),
      trigger: "blur"
    }
  ]
};

const isEdit = ref(false);

function resetForm() {
  formRef.value?.clearValidate();
  Object.assign(form, {
    couponId: null,
    name: "",
    type: 1,
    value: "",
    minOrderAmount: "0",
    totalStock: 0,
    perUserLimit: 1,
    validDays: 30,
    autoGrantOnRegister: 0
  });
}

watch(
  () => props.visible,
  val => {
    if (val) {
      if (props.editRow) {
        isEdit.value = true;
        Object.assign(form, {
          couponId: props.editRow.id,
          name: props.editRow.name,
          type: props.editRow.type,
          value: props.editRow.value,
          minOrderAmount: props.editRow.min_order_amount,
          totalStock: props.editRow.total_stock,
          perUserLimit: props.editRow.per_user_limit ?? 1,
          validDays: props.editRow.valid_days,
          autoGrantOnRegister: props.editRow.auto_grant_on_register ?? 0
        });
      } else {
        isEdit.value = false;
        resetForm();
      }
    }
  }
);

async function save() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const r = isEdit.value ? await updateCoupon(form) : await addCoupon(form);
    if (r?.success) {
      message("保存成功", { type: "success" });
      emit("update:visible", false);
      emit("submit");
    } else {
      message(r?.msg || "操作失败", { type: "warning" });
    }
  } catch {
    message("网络异常", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadDicts() {
  try {
    const r = await getDictData("coupon_type");
    if (r?.success && Array.isArray(r.data)) typeOptions.value = r.data;
  } catch {
    /* ignore */
  }
}

onMounted(loadDicts);
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑优惠券' : '新增优惠券'"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width: 100%">
          <el-option
            v-for="s in typeOptions"
            :key="s.dict_key"
            :label="s.dict_value"
            :value="s.dict_key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="面值" prop="value">
        <el-input v-model="form.value" placeholder="金额/百分比/兑换值" />
      </el-form-item>
      <el-form-item label="最低消费">
        <el-input v-model="form.minOrderAmount" placeholder="0表示无门槛" />
      </el-form-item>
      <el-form-item label="库存">
        <el-input-number v-model="form.totalStock" :min="0" style="width: 100%" />
      </el-form-item>
      <el-form-item label="每人限领">
        <el-input-number v-model="form.perUserLimit" :min="0" style="width: 100%" />
        <span style="font-size:12px;color:#909399;margin-left:8px">0=不限</span>
      </el-form-item>
      <el-form-item label="有效期(天)" prop="validDays">
        <el-input-number v-model="form.validDays" :min="1" style="width: 100%" />
      </el-form-item>
      <el-form-item label="新人注册发券">
        <el-switch v-model="form.autoGrantOnRegister" :active-value="1" :inactive-value="0" />
        <span style="font-size:12px;color:#909399;margin-left:8px">绑手机号后自动发放</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
