<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { message } from "@/utils/message";
import { replyFeedback } from "@/api/feedback";
import { getDictData } from "@/api/dict";

defineOptions({ name: "FeedbackReplyDialog" });

const props = defineProps<{ visible: boolean; data: any }>();
const emit = defineEmits<{ (e: "update:visible", v: boolean): void; (e: "success"): void }>();

const form = reactive({ feedbackId: 0, replyContent: "" });
const typeDict = ref<any[]>([]);
const typeLabel = (t: number) => {
  const item = typeDict.value.find((d: any) => d.dict_key === t);
  return item ? item.dict_value : String(t);
};

const loadDict = async () => {
  try {
    const r = await getDictData("feedback_type");
    if (r?.success && Array.isArray(r.data)) typeDict.value = r.data;
  } catch { /* ignore */ }
};

watch(() => props.visible, v => {
  if (v && props.data) {
    if (!typeDict.value.length) loadDict();
    form.feedbackId = props.data.id;
    form.replyContent = "";
  }
});

const save = async () => {
  if (!form.replyContent.trim()) { message("请输入回复内容", { type: "warning" }); return; }
  const r = await replyFeedback({ feedbackId: form.feedbackId, replyContent: form.replyContent });
  if (r?.success) { message("已回复", { type: "success" }); emit("update:visible", false); emit("success"); }
  else message(r?.msg || "操作失败", { type: "warning" });
};
</script>

<template>
  <el-dialog :model-value="visible" title="回复评价" width="480px" :close-on-click-modal="false" @update:model-value="emit('update:visible', $event)">
    <el-descriptions v-if="data" :column="1" border size="small">
      <el-descriptions-item label="顾客">{{ data.customer_name || "-" }}</el-descriptions-item>
      <el-descriptions-item label="类型">{{ typeLabel(data.feedback_type) }}</el-descriptions-item>
      <el-descriptions-item label="评分">{{ data.rating ? "★".repeat(data.rating) : "-" }}</el-descriptions-item>
      <el-descriptions-item label="内容"><div style="white-space:pre-wrap">{{ data.content }}</div></el-descriptions-item>
      <el-descriptions-item v-if="data.reply_content" label="已回复">{{ data.reply_content }}</el-descriptions-item>
    </el-descriptions>
    <el-form v-if="!(data?.status === 2)" label-width="80px" style="margin-top:16px">
      <el-form-item label="回复内容" required>
        <el-input v-model="form.replyContent" type="textarea" :rows="3" placeholder="输入回复内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">关闭</el-button>
      <el-button v-if="!(data?.status === 2)" type="primary" @click="save">提交回复</el-button>
    </template>
  </el-dialog>
</template>
