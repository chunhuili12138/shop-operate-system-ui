<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import type { FormInstance } from "element-plus";
import { message } from "@/utils/message";
import { addStaff, updateStaff, getRoleList } from "@/api/system";
import { useUserStoreHook } from "@/store/modules/user";

interface Props {
  visible?: boolean;
  title?: string;
  isEdit?: boolean;
  staffData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: "",
  isEdit: false,
  staffData: null
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const formRef = ref<FormInstance>();
const roles = ref<{ id: number; name: string }[]>([]);

// 新增员工时可选的角色（排除超级管理员 id=2 和店长 id=3）
const addableRoles = computed(() =>
  roles.value.filter(r => r.id !== 2 && r.id !== 3)
);

const form = reactive({
  staffId: null as any,
  name: "",
  phone: "",
  username: "",
  password: "",
  roleIds: [] as number[],
  shopId: "" as any,
  employmentType: 1,
  remark: ""
});

const loadOptions = async () => {
  const r = await getRoleList();
  if (r?.success) roles.value = r.data;
};

// 监听对话框打开，初始化表单数据
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      loadOptions();
      if (props.isEdit && props.staffData) {
        // 编辑模式：填充现有数据
        const userStore = useUserStoreHook();
        Object.assign(form, {
          staffId: props.staffData.id,
          name: props.staffData.name,
          phone: props.staffData.phone,
          username: "",
          password: "",
          roleIds: [],
          shopId: userStore.currentShopId ?? props.staffData.shop_id,
          employmentType: props.staffData.employment_type,
          remark: props.staffData.remark
        });
      } else {
        // 新增模式：重置表单
        const userStore = useUserStoreHook();
        Object.assign(form, {
          staffId: null,
          name: "",
          phone: "",
          username: "",
          password: "",
          roleIds: [],
          shopId: userStore.currentShopId ?? "",
          employmentType: 1,
          remark: ""
        });
      }
    }
  }
);

const save = async () => {
  if (!formRef.value) return;
  await formRef.value.validate();

  const res = props.isEdit ? await updateStaff(form) : await addStaff(form);
  if (res?.success) {
    message("操作成功", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } else {
    message(res?.msg || "操作失败", { type: "warning" });
  }
};

const handleCancel = () => {
  dialogVisible.value = false;
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    class="dialog-sm"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item
        label="姓名"
        prop="name"
        :rules="[{ required: true, message: '必填' }]"
      >
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item
        v-if="!isEdit"
        label="用户名"
        prop="username"
        :rules="[{ required: true, message: '必填' }]"
      >
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item
        v-if="!isEdit"
        label="密码"
        prop="password"
        :rules="[{ required: true, message: '必填' }]"
      >
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
        />
      </el-form-item>
      <el-form-item label="角色" prop="roleIds">
        <el-select
          v-model="form.roleIds"
          multiple
          style="width: 100%"
          placeholder="请选择角色"
        >
          <el-option
            v-for="r in addableRoles"
            :key="r.id"
            :label="r.name"
            :value="r.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用工类型">
        <el-radio-group v-model="form.employmentType">
          <el-radio :value="1">全职</el-radio>
          <el-radio :value="2">兼职</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
