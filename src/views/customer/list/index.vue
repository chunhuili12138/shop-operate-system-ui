<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";

defineOptions({ name: "CustomerList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", source: "" as any });

// ---- 详情抽屉 ----
const detailVisible = ref(false);
const detail = ref<any>({});
const purchases = ref([]);
const wallet = ref<any>({});
const pointsList = ref([]);

// ---- 新增弹窗 ----
const addDialog = ref(false);
const addFormRef = ref<FormInstance>();
const addForm = reactive({
  customersId: null as number | null,
  nickname: "",
  phone: "",
  gender: null as number | null,
  birthday: "",
  remark: "",
  tags: ""
});

// ---- 编辑弹窗 ----
const editDialog = ref(false);
const editFormRef = ref<FormInstance>();
const editForm = reactive({
  customersId: null as number | null,
  nickname: "",
  phone: "",
  gender: null as number | null,
  birthday: "",
  remark: "",
  tags: ""
});

const load = async () => {
  loading.value = true;
  try {
    const r: any = await http.get("/customers/page", {
      params: { page: page.value, size: size.value, ...query }
    });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.keyword = "";
  query.source = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openAdd = () => {
  Object.assign(addForm, {
    customersId: null,
    nickname: "",
    phone: "",
    gender: null,
    birthday: "",
    remark: "",
    tags: ""
  });
  addDialog.value = true;
};

const saveAdd = async () => {
  const r: any = await http.post("/customers/add", { data: addForm });
  if (r?.success) {
    message("新增成功", { type: "success" });
    addDialog.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openEdit = (row: any) => {
  Object.assign(editForm, {
    customersId: row.id,
    nickname: row.nickname,
    phone: row.phone,
    gender: row.gender,
    birthday: row.birthday,
    remark: row.remark,
    tags: row.tags || ""
  });
  editDialog.value = true;
};

const saveEdit = async () => {
  const r: any = await http.put("/customers/update", { data: editForm });
  if (r?.success) {
    message("编辑成功", { type: "success" });
    editDialog.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

// ---- 详情 ----
const openDetail = async (id: number) => {
  const r: any = await http.get("/customers/info", {
    params: { customersId: id }
  });
  if (r?.success) {
    detail.value = r.data;
    const [w, p, pu]: any = await Promise.all([
      http.get("/customers/wallet", { params: { customersId: id } }),
      http.get("/customers/purchases", { params: { customersId: id, page: 1, size: 50 } }),
      http.get("/customers/points", { params: { customersId: id, page: 1, size: 50 } })
    ]);
    if (w?.success) wallet.value = w.data;
    if (p?.success) purchases.value = p.data.list;
    if (pu?.success) pointsList.value = pu.data.list;
  }
  detailVisible.value = true;
};

const adjWallet = (cid: number, type: number) => {
  import("element-plus").then(m =>
    m.ElMessageBox.prompt("输入金额", "钱包调整").then(async ({ value }: any) => {
      const r: any = await http.post("/customers/walletAdjust", {
        data: { customersId: cid, type, amount: value, remark: "手动调整" }
      });
      if (r?.success) {
        message("调整成功", { type: "success" });
        openDetail(cid);
      } else {
        message(r?.msg || "失败", { type: "warning" });
      }
    })
  );
};

const adjPoints = (cid: number) => {
  import("element-plus").then(m =>
    m.ElMessageBox.prompt("输入积分数量（正数增加，负数扣减）", "积分调整").then(
      async ({ value }: any) => {
        const r: any = await http.put("/customers/pointsAdjust", {
          data: { customersId: cid, points: parseInt(value), remark: "手动调整" }
        });
        if (r?.success) {
          message("调整成功", { type: "success" });
          openDetail(cid);
        } else {
          message(r?.msg || "失败", { type: "warning" });
        }
      }
    )
  );
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <!-- 搜索/筛选区 -->
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="昵称/手机号"
            clearable
            style="width:200px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-select
            v-model="query.source"
            clearable
            placeholder="全部"
            style="width:120px"
          >
            <el-option label="小程序" value="miniapp" />
            <el-option label="美团" value="meituan" />
            <el-option label="抖音" value="douyin" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">
            + 新增顾客
          </el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
                style="width: 100%"
        @row-click="(r: any) => openDetail(r.id)"
      >
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="性别" width="60" align="center">
          <template #default="{ row }">
            <span class="text-sm text-dim">
              {{ row.gender === 1 ? "男" : row.gender === 2 ? "女" : "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openEdit(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页区 -->
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="page-pagination"
      @size-change="onSizeChange"
      @current-change="load"
    />

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="顾客详情" size="560px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="昵称">
            {{ detail.nickname }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ detail.phone }}
          </el-descriptions-item>
        </el-descriptions>
        <el-divider />

        <!-- 钱包卡片 -->
        <div class="mb-4 grid grid-cols-1 gap-3">
          <div class="rounded-lg border border-[var(--ad-border)] p-4">
            <div class="text-sm font-medium mb-2">钱包</div>
            <div class="grid grid-cols-3 gap-3 mb-3">
              <div>
                <div class="text-xs text-dim">余额</div>
                <div class="text-lg font-bold" style="color:var(--el-color-primary)">
                  ¥{{ wallet?.balance || 0 }}
                </div>
              </div>
              <div>
                <div class="text-xs text-dim">累计充值</div>
                <div class="text-sm font-medium">¥{{ wallet?.total_recharged || 0 }}</div>
              </div>
              <div>
                <div class="text-xs text-dim">累计消费</div>
                <div class="text-sm font-medium">¥{{ wallet?.total_spent || 0 }}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <el-button size="small" type="primary" @click="adjWallet(detail.id, 1)">
                充值
              </el-button>
              <el-button size="small" type="warning" plain @click="adjWallet(detail.id, 4)">
                扣减
              </el-button>
            </div>
          </div>
        </div>

        <el-tabs>
          <el-tab-pane label="购买记录">
            <el-table :data="purchases" size="small">
              <el-table-column prop="package_name" label="套餐" />
              <el-table-column prop="total_amount" label="金额" width="100" />
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag
                    :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'info'"
                    size="small"
                  >
                    {{ row.status === 1 ? "有效" : row.status === 2 ? "已退款" : "已过期" }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="积分">
            <el-table :data="pointsList" size="small">
              <el-table-column prop="points" label="积分" width="80" />
              <el-table-column prop="balance_after" label="余额" width="80" />
              <el-table-column prop="remark" label="说明" />
              <el-table-column prop="created_at" label="时间" width="170" />
            </el-table>
            <el-button
              size="small"
              type="primary"
              class="mt-2"
              @click="adjPoints(detail.id)"
            >
              积分调整
            </el-button>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>

    <!-- 新增弹窗 -->
    <el-dialog
      v-model="addDialog"
      title="新增顾客"
      width="460px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form ref="addFormRef" :model="addForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="addForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="addForm.gender" clearable placeholder="请选择" style="width:100%">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="生日">
          <el-input v-model="addForm.birthday" placeholder="yyyy-MM-dd" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAdd">保存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="editDialog"
      title="编辑顾客"
      width="460px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender" clearable style="width:100%">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="生日">
          <el-input v-model="editForm.birthday" placeholder="yyyy-MM-dd" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editForm.tags" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
