<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "@/utils/message";
import { fileUrl } from "@/utils/file";
import type { FormInstance, FormRules } from "element-plus";
import type { BomItem } from "@/api/package";
import { getPackageBom } from "@/api/package";
import { getMaterialList } from "@/api/inventory";
import { getDictData } from "@/api/system";
import EpPlus from "~icons/ep/plus";
import { http } from "@/utils/http";

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  formData?: any;
  shopId: number;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "save"): void;
}>();

const formRef = ref<FormInstance>();

const rules: FormRules = {
  name: [{ required: true, message: "请输入套餐名称", trigger: "blur" }],
  durationMinutes: [
    { required: true, message: "请输入时长", trigger: "blur" },
    {
      validator: (_r, v, cb) => (v > 0 ? cb() : cb(new Error("时长必须大于0"))),
      trigger: "blur"
    }
  ],
  price: [
    { required: true, message: "请输入价格", trigger: "blur" },
    {
      validator: (_r, v, cb) =>
        Number(v) >= 0 ? cb() : cb(new Error("价格不能为负")),
      trigger: "blur"
    }
  ]
};

const form = reactive({
  packageId: null as number | null,
  name: "",
  type: "SINGLE",
  durationMinutes: 60,
  price: 0,
  originalPrice: null as number | null,
  maxPeoplePerSession: 1,
  description: "",
  image: "",
  bom: [] as BomItem[]
});

const typeOptions = ref<
  { dict_key: number; dict_value: string; dict_label: string }[]
>([]);
const materialOptions = ref<any[]>([]);

const imageUploadRef = ref();
const pendingImageFile = ref<File | null>(null);
const imageFileList = ref<any[]>([]);

const loadDicts = async () => {
  const [typeR] = await Promise.all([
    getDictData({ dictCode: "package_type" })
  ]);
  if (typeR?.success && Array.isArray(typeR.data))
    typeOptions.value = typeR.data;
};

const loadMaterials = async () => {
  const r = await getMaterialList({ page: 1, size: 999 });
  if (r?.success) materialOptions.value = r.data.list;
};

// 编辑时加载已有 BOM
const loadBom = async (packageId: number) => {
  const r = await getPackageBom(packageId);
  if (r?.success && Array.isArray(r.data)) {
    form.bom = r.data.map((item: any) => ({
      materialId: String(item.material_id || ""),
      quantity: Number(item.quantity) || 1
    }));
  }
};

loadDicts();

watch(
  () => props.visible,
  v => {
    if (v) {
      loadMaterials();
      pendingImageFile.value = null;
      imageFileList.value = [];
      if (props.formData) {
        Object.assign(form, {
          ...props.formData,
          originalPrice: props.formData.original_price ?? null,
          image: props.formData.image || "",
          bom: [] as BomItem[]
        });
        if (props.isEdit && props.formData.packageId) {
          loadBom(props.formData.packageId);
        }
        if (props.formData.image) {
          imageFileList.value = [
            {
              name: "套餐图片",
              url: fileUrl(props.formData.image)
            }
          ];
        }
      }
      setTimeout(() => formRef.value?.clearValidate(), 0);
    }
  }
);

const handleClose = () => {
  emit("update:visible", false);
};

const handleImgChange = (f: any, fl: any[]) => {
  const raw = f.raw as File;
  if (!raw) return;
  if (
    !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(raw.type)
  ) {
    message("仅支持 jpg/png/gif/webp", { type: "warning" });
    imageUploadRef.value?.clearFiles();
    return;
  }
  if (raw.size / 1024 / 1024 > 5) {
    message("图片不超过5MB", { type: "warning" });
    imageUploadRef.value?.clearFiles();
    return;
  }
  pendingImageFile.value = raw;
  imageFileList.value = fl;
};
const handleImgRemove = () => {
  pendingImageFile.value = null;
  imageFileList.value = [];
  form.image = "";
};
const handleExceed = () => {
  message("最多1张", { type: "warning" });
};

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.bom.length > 0) {
    for (const item of form.bom) {
      if (!item.materialId) {
        message("请为每项物料选择具体物料", { type: "warning" });
        return;
      }
    }
  }
  // 有选中图片则先上传
  if (pendingImageFile.value) {
    const fd = new FormData();
    fd.append("file", pendingImageFile.value);
    fd.append("dir", "package");
    const up: any = await http.request("post", "/file/upload", {
      data: fd,
      headers: { "Content-Type": "multipart/form-data" }
    });
    if (up?.success && (up.data || up.path)) {
      form.image = up.data || up.path;
    } else {
      message(up?.msg || "图片上传失败", { type: "warning" });
      return;
    }
  }
  emit("save");
};

const addBomRow = () => {
  form.bom.push({ materialId: "", quantity: 1 });
};

const removeBomRow = (index: number) => {
  form.bom.splice(index, 1);
};

defineExpose({ form });
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑套餐' : '新增套餐'"
    width="650px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入套餐名称"
          maxlength="50"
        />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="类型">
            <el-select
              v-model="form.type"
              placeholder="请选择类型"
              style="width: 100%"
            >
              <el-option
                v-for="t in typeOptions"
                :key="t.dict_key"
                :label="t.dict_value"
                :value="t.dict_label"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="时长(分)" prop="durationMinutes">
            <el-input-number
              v-model="form.durationMinutes"
              :min="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="现价" prop="price">
            <el-input-number
              v-model="form.price"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="原价">
            <el-input-number
              v-model="form.originalPrice"
              :min="0"
              :precision="2"
              placeholder="选填，划线展示"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="最大人数">
            <el-input-number
              v-model="form.maxPeoplePerSession"
              :min="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="选填套餐描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="套餐图片">
        <el-upload
          ref="imageUploadRef"
          v-model:file-list="imageFileList"
          list-type="picture-card"
          :limit="1"
          :auto-upload="false"
          :on-change="handleImgChange"
          :on-remove="handleImgRemove"
          :on-exceed="handleExceed"
          :class="{ hideUploadBtn: imageFileList.length >= 1 }"
          accept="image/*"
        >
          <EpPlus />
        </el-upload>
        <span class="upload-hint">建议 600px * 400px</span>
      </el-form-item>
      <el-form-item label="物料清单">
        <div class="mb-2">
          <el-button size="small" type="primary" @click="addBomRow"
            >+ 添加物料</el-button
          >
          <span class="text-xs text-dim ml-1"
            >可选，设置单次消耗的物料，在结束时自动扣减物料库存</span
          >
        </div>
        <div
          v-for="(b, i) in form.bom"
          :key="i"
          class="flex items-center gap-2 mb-2 p-2 rounded"
          style="background: var(--el-fill-color-light)"
        >
          <span class="text-xs text-dim w-6">{{ i + 1 }}</span>
          <el-select
            v-model="b.materialId"
            placeholder="选择物料"
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="m in materialOptions"
              :key="m.id"
              :label="`${m.name} (${m.sku || '-'})`"
              :value="String(m.id)"
            />
          </el-select>
          <el-input-number
            v-model="b.quantity"
            :min="1"
            placeholder="用量"
            style="width: 100px"
          />
          <el-button size="small" type="danger" plain @click="removeBomRow(i)"
            >删除</el-button
          >
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.hideUploadBtn .el-upload--picture-card) {
  display: none;
}

.upload-hint {
  display: block;
  padding-left: 5px;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}
</style>
