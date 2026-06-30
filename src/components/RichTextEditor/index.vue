<script setup lang="ts">
import { shallowRef, computed, onBeforeUnmount } from "vue";
import { fileUrl } from "@/utils/file";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import type {
  IDomEditor,
  IEditorConfig,
  IToolbarConfig
} from "@wangeditor/editor";
import { http } from "@/utils/http";
import "@wangeditor/editor/dist/css/style.css";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    height?: number;
    readOnly?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "请输入内容...",
    height: 400,
    readOnly: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const editorRef = shallowRef<IDomEditor>();
const mode = "default";

const htmlValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.readOnly,
  autoFocus: false,
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string) => void) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res: any = await http.request(
            "post",
            "/file/uploadArticleImage",
            {
              data: formData,
              headers: { "Content-Type": "multipart/form-data" }
            }
          );
          if (res?.success && res.data) {
            insertFn(fileUrl(res.data));
          }
        } catch (e) {
          console.error("图片上传失败", e);
        }
      }
    },
    uploadVideo: {
      async customUpload(file: File, insertFn: (url: string) => void) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res: any = await http.request(
            "post",
            "/file/uploadArticleVideo",
            {
              data: formData,
              headers: { "Content-Type": "multipart/form-data" }
            }
          );
          if (res?.success && res.data) {
            insertFn(fileUrl(res.data));
          }
        } catch (e) {
          console.error("视频上传失败", e);
        }
      }
    }
  }
};

const toolbarConfig: Partial<IToolbarConfig> = {};

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
};

const handleChange = (editor: IDomEditor) => {
  emit("update:modelValue", editor.getHtml());
};

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }
});
</script>

<template>
  <div :style="{ border: '1px solid #dcdfe6', borderRadius: '4px' }">
    <Toolbar
      :style="{ borderBottom: '1px solid #dcdfe6' }"
      :editor="editorRef"
      :default-config="toolbarConfig"
      :mode="mode"
    />
    <Editor
      v-model="htmlValue"
      :style="{ height: height + 'px' }"
      :default-config="editorConfig"
      :mode="mode"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>
