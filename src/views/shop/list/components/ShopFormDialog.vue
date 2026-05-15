<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { FormInstance } from "element-plus";
import { message } from "@/utils/message";
import { getUnboundSeats } from "@/api/tenant";
import { addShop, updateShop } from "@/api/shop";

interface Props {
  visible?: boolean;
  isEdit?: boolean;
  shopData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  isEdit: false,
  shopData: null
});

const emit = defineEmits(["update:visible", "success"]);

const formRef = ref<FormInstance>();
const seatOptions = ref([] as any[]);

const form = reactive({
  shopsId: null as number | null,
  name: "",
  address: "",
  contactPhone: "",
  maxCapacity: 20,
  description: "",
  seatId: ""
});

// 初始化表单数据
const initForm = async () => {
  if (props.isEdit && props.shopData) {
    const d = props.shopData;
    Object.assign(form, {
      shopsId: d.id,
      name: d.name,
      address: d.address,
      contactPhone: d.contact_phone,
      maxCapacity: d.max_capacity,
      description: d.description,
      seatId: ""
    });
  } else {
    // 新增模式，加载未绑定席位
    Object.assign(form, {
      shopsId: null,
      name: "",
      address: "",
      contactPhone: "",
      maxCapacity: 20,
      description: "",
      seatId: ""
    });
    const r = await getUnboundSeats();
    if (r?.success) seatOptions.value = r.data || [];
  }
};

// 保存表单
const save = async () => {
  const r = props.isEdit ? await updateShop(form) : await addShop(form);
  if (r?.success) {
    message("保存成功", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

// 关闭对话框
const handleClose = () => {
  emit("update:visible", false);
};

// 监听visible变化，初始化表单
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      initForm();
    }
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑店铺' : '新增店铺'"
    width="520px"
    class="dialog-md"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="店铺名称" required>
        <el-input v-model="form.name" placeholder="请输入店铺名称" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="关联席位" required>
        <el-select
          v-model="form.seatId"
          placeholder="请选择席位"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="s in seatOptions"
            :key="s.id"
            :label="`${s.seat_no} (${s.staff_name})`"
            :value="s.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="最大容量">
        <el-input-number
          v-model="form.maxCapacity"
          :min="1"
          placeholder="不限"
        />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="地址">
        <el-input
          v-model="form.address"
          type="textarea"
          :rows="2"
          placeholder="请输入地址"
        />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入店铺描述"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
