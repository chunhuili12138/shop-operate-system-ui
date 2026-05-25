<script setup lang="ts">
import { ref, watch, reactive, computed } from "vue";
import { message } from "@/utils/message";
import { addCommissionRule, updateCommissionRule } from "@/api/finance";
import { getDictData } from "@/api/dict";
import { getRoleList } from "@/api/system";

defineOptions({ name: "CommissionRuleDialog" });

const props = defineProps<{
  visible: boolean;
  ruleData: any | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
}>();

const isEdit = computed(() => !!props.ruleData);
const ruleTypeDict = ref<any[]>([]);
const roleList = ref<any[]>([]);
const form = reactive({
  ruleId: 0,
  roleId: "",
  ruleType: 1,
  value: 0,
  description: ""
});

const valuePlaceholder = computed(() => {
  if (form.ruleType === 1) return "每场提成金额，如 10 = 每场提成 10 元";
  if (form.ruleType === 2) return "收入百分比，如 5 = 提流水的 5%";
  return "每月固定提成，如 500 = 月固定 500 元";
});

const valueTip = computed(() => {
  if (form.ruleType === 1)
    return "每核销一场提成该金额，如填 10 则每场得 10 元";
  if (form.ruleType === 2)
    return "按核销流水收入百分比提成，如填 5 则提流水的 5%";
  return "每月固定金额提成，与核销次数无关";
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

watch(
  () => props.visible,
  v => {
    if (v) {
      if (!ruleTypeDict.value.length || !roleList.value.length) loadDicts();
      if (props.ruleData) {
        Object.assign(form, {
          ruleId: props.ruleData.id,
          roleId: String(props.ruleData.role_id || ""),
          ruleType: props.ruleData.rule_type,
          value: Number(props.ruleData.value || 0),
          description: props.ruleData.description || ""
        });
      } else {
        Object.assign(form, {
          ruleId: 0,
          roleId: "",
          ruleType: 1,
          value: 0,
          description: ""
        });
      }
    }
  }
);

const save = async () => {
  const data: any = {
    ruleId: form.ruleId,
    ruleType: form.ruleType,
    value: form.value,
    description: form.description
  };
  const r = isEdit.value
    ? await updateCommissionRule(data)
    : await addCommissionRule({ roleId: form.roleId, ...data } as any);
  if (r?.success) {
    message(isEdit.value ? "规则已更新" : "规则已添加", { type: "success" });
    emit("update:visible", false);
    emit("success");
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑提成规则' : '新增提成规则'"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item v-if="!isEdit" label="角色" required>
        <el-select
          v-model="form.roleId"
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
        <el-select v-model="form.ruleType" style="width: 100%">
          <el-option
            v-for="d in ruleTypeDict"
            :key="d.dict_key"
            :label="d.dict_value"
            :value="d.dict_label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="值" required>
        <el-input-number
          v-model="form.value"
          :min="0"
          :precision="2"
          :placeholder="valuePlaceholder"
          style="width: 100%"
        />
        <el-text
          type="info"
          size="small"
          style="display: block; margin-top: 4px"
          >{{ valueTip }}</el-text
        >
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" placeholder="备注说明" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
