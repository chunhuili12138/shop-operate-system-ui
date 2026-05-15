// ================================================================
// 通用列表页 composable — 统一 CRUD 模式 + 分页 + 筛选 + 表单弹窗
// 与 page-layout.scss 设计令牌协同，保证 30+ 页面一致性
// ================================================================
import { ref, reactive, onMounted, type Ref } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";
// ---- 泛型约束 ----
type RecordWithId = { id: number | null } & Record<string, any>;
type ApiResult = { success: boolean; data?: any; msg?: string };

// ---- 配置选项 ----
export interface ListPageOptions<TForm extends RecordWithId> {
  /** API 路径前缀，如 "/shops" */
  apiPrefix: string;
  /** 列表接口路径，默认 `${apiPrefix}/page` */
  listPath?: string;
  /** 新增接口路径，默认 `${apiPrefix}/add` */
  addPath?: string;
  /** 更新接口路径，默认 `${apiPrefix}/update` */
  updatePath?: string;
  /** 删除接口路径，默认 `${apiPrefix}/delete` */
  deletePath?: string;
  /** 详情接口路径，默认 `${apiPrefix}/info` */
  infoPath?: string;
  /** 默认每页条数 */
  defaultPageSize?: number;
  /** 默认分页参数 */
  defaultQuery?: Record<string, any>;
  /** 新增表单初始值 */
  emptyForm: TForm;
  /** 编辑时从 row 映射到 form 的转换函数 */
  mapRowToForm: (row: any) => Partial<TForm>;
  /** 删除确认提示文本 */
  deleteConfirmText?: string;
  /** 删除确认标题 */
  deleteConfirmTitle?: string;
  /** 无需分页（全量加载） */
  noPagination?: boolean;
  /** 是否自动加载 */
  autoLoad?: boolean;
  /** 容器 ref excludeClass（预留预警横幅高度） */
  excludeClass?: string;
}

export function useListPage<TForm extends RecordWithId>(
  options: ListPageOptions<TForm>
) {
  const {
    apiPrefix,
    listPath = `${apiPrefix}/page`,
    addPath = `${apiPrefix}/add`,
    updatePath = `${apiPrefix}/update`,
    deletePath = `${apiPrefix}/delete`,
    infoPath = `${apiPrefix}/info`,
    defaultPageSize = 20,
    defaultQuery = {},
    emptyForm,
    mapRowToForm,
    deleteConfirmText = "确认删除？",
    deleteConfirmTitle = "提示",
    noPagination = false,
    autoLoad = true,
    excludeClass
  } = options;

  // ---- 列表状态 ----
  const tableData = ref<any[]>([]) as Ref<any[]>;
  const loading = ref(false);
  const page = ref(1);
  const size = ref(defaultPageSize);
  const total = ref(0);
  const query = reactive<Record<string, any>>({ ...defaultQuery });

  // ---- 弹窗状态 ----
  const dialogVisible = ref(false);
  const isEdit = ref(false);
  const form = reactive<TForm>({ ...emptyForm }) as TForm;
  const formLoading = ref(false);

  // ---- 加载列表 ----
  const loadData = async () => {
    loading.value = true;
    try {
      const params: Record<string, any> = noPagination
        ? { ...query }
        : { page: page.value, size: size.value, ...query };
      const r: any = await http.get(listPath, { params }) as ApiResult;
      if (r?.success) {
        if (noPagination) {
          tableData.value = Array.isArray(r.data) ? r.data : r.data?.list ?? [];
        } else {
          tableData.value = r.data?.list ?? [];
          total.value = r.data?.total ?? 0;
        }
      }
    } finally {
      loading.value = false;
    }
  };

  // ---- 重置筛选 ----
  const resetQuery = () => {
    Object.keys(query).forEach(k => {
      query[k] = defaultQuery[k] ?? "";
    });
    page.value = 1;
    loadData();
  };

  // ---- 分页 ----
  const onSizeChange = (s: number) => {
    size.value = s;
    page.value = 1;
    loadData();
  };

  const onPageChange = () => loadData();

  // ---- 新增 ----
  const openAdd = () => {
    isEdit.value = false;
    Object.assign(form, emptyForm);
    dialogVisible.value = true;
  };

  // ---- 编辑 ----
  const openEdit = async (rowOrId: any) => {
    isEdit.value = true;
    const id = typeof rowOrId === "object" ? rowOrId.id : rowOrId;
    try {
      const r: any = await http.get(infoPath, {
        params: { [`${extractIdKey(apiPrefix)}Id`]: id }
      }) as ApiResult;
      if (r?.success && r.data) {
        Object.assign(form, { id: null, ...emptyForm }, mapRowToForm(r.data));
      } else {
        // 无详情接口则直接映射行数据
        Object.assign(
          form,
          { id: null, ...emptyForm },
          mapRowToForm(typeof rowOrId === "object" ? rowOrId : { id })
        );
      }
    } catch {
      Object.assign(
        form,
        { id: null, ...emptyForm },
        mapRowToForm(typeof rowOrId === "object" ? rowOrId : { id })
      );
    }
    dialogVisible.value = true;
  };

  // ---- 保存 ----
  const save = async () => {
    formLoading.value = true;
    try {
      const url = isEdit.value ? updatePath : addPath;
      const method = isEdit.value ? "put" : "post";
      const r: any = await http.request(method, url, {
        data: { ...form }
      }) as ApiResult;
      if (r?.success) {
        message("操作成功", { type: "success" });
        dialogVisible.value = false;
        loadData();
      } else {
        message(r?.msg || "操作失败", { type: "warning" });
      }
    } finally {
      formLoading.value = false;
    }
  };

  // ---- 删除 ----
  const doDelete = async (rowOrId: any) => {
    const id = typeof rowOrId === "object" ? rowOrId.id : rowOrId;
    await import("element-plus").then(m =>
      m.ElMessageBox.confirm(deleteConfirmText, deleteConfirmTitle)
    );
    const r: any = await http.delete(deletePath, {
      params: { [`${extractIdKey(apiPrefix)}Id`]: id }
    }) as ApiResult;
    if (r?.success) {
      message("已删除", { type: "success" });
      loadData();
    } else {
      message(r?.msg || "删除失败", { type: "warning" });
    }
  };

  // ---- 快捷操作：变更单字段 ----
  const quickAction = async (
    actionPath: string,
    data: Record<string, any>,
    successMsg = "操作成功"
  ) => {
    const r: any = await http.put(actionPath, { data }) as ApiResult;
    if (r?.success) {
      message(successMsg, { type: "success" });
      loadData();
    } else {
      message(r?.msg || "操作失败", { type: "warning" });
    }
  };

  // ---- 详情获取 ----
  const getDetail = async (rowOrId: any): Promise<any | null> => {
    const id = typeof rowOrId === "object" ? rowOrId.id : rowOrId;
    const r: any = await http.get(infoPath, {
      params: { [`${extractIdKey(apiPrefix)}Id`]: id }
    }) as ApiResult;
    return r?.success ? r.data : null;
  };

  if (autoLoad) onMounted(loadData);

  return {
    // 状态
    tableData,
    loading,
    page,
    size,
    total,
    query,
    dialogVisible,
    isEdit,
    form,
    formLoading,
    // 方法
    loadData,
    resetQuery,
    onSizeChange,
    onPageChange,
    openAdd,
    openEdit,
    save,
    doDelete,
    quickAction,
    getDetail
  };
}

// ---- 辅助：从 apiPrefix 提取 ID 键名 ----
function extractIdKey(prefix: string): string {
  const parts = prefix.replace(/^\//, "").split("/");
  const last = parts[parts.length - 1];
  // shops → shopsId, packages → packagesId, customers → customersId
  return last + "Id";
}
