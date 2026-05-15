<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getInventoryList,
  getInventoryWarnings,
  inventoryInbound,
  inventoryOutbound,
  getInventoryTransactions
} from "@/api/inventory";

defineOptions({ name: "InvList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "" });

const warnList = ref<any[]>([]);
const warnDialog = ref(false);
const ioDialog = ref(false);
const ioType = ref(1);
const ioForm = reactive({ materialId: "", quantity: "", remark: "" });
const txDialog = ref(false);
const txList = ref([]);

const load = async () => {
  loading.value = true;
  try {
    const r = await getInventoryList({
      page: page.value,
      size: size.value,
      ...query
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
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const loadWarn = async () => {
  const r = await getInventoryWarnings();
  if (r?.success) warnList.value = r.data || [];
  warnDialog.value = true;
};

const openIo = (type: number, materialId: string) => {
  ioType.value = type;
  ioForm.materialId = materialId;
  ioForm.quantity = "";
  ioForm.remark = "";
  ioDialog.value = true;
};

const doIo = async () => {
  const r = ioType.value === 1 
    ? await inventoryInbound(ioForm)
    : await inventoryOutbound(ioForm);
  if (r?.success) {
    message("操作成功", { type: "success" });
    ioDialog.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openTx = async (mid: string) => {
  const r = await getInventoryTransactions({
    materialId: mid,
    page: 1,
    size: 50
  });
  if (r?.success) txList.value = r.data.list;
  txDialog.value = true;
};

onMounted(load);
</script>

<template>
  <div class="page-container">
    <!-- 库存预警横幅 -->
    <div
      v-if="warnList.length"
      class="page-warn flex items-center gap-2"
      @click="warnDialog = true"
    >
      <span class="text-sm font-medium" style="color: var(--el-color-danger)">
        {{ warnList.length }} 项库存预警
      </span>
      <span class="text-xs text-dim">点击查看详情</span>
    </div>

    <!-- 搜索/筛选区 -->
    <div class="page-header">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="物料名称/SKU"
            clearable
            style="width:200px"
            @keyup.enter="load"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="warning" plain @click="loadWarn">预警列表</el-button>
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
      >
        <el-table-column prop="material_name" label="物料" min-width="120" />
        <el-table-column prop="sku" label="SKU" width="100" />
        <el-table-column
          prop="quantity"
          label="当前数量"
          width="90"
          align="center"
        />
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column label="预警值" width="70" align="center">
          <template #default="{ row }">
            <span class="text-dim">{{ row.min_stock || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.quantity <= row.min_stock ? 'danger' : 'success'"
              size="small"
            >
              {{ row.quantity <= row.min_stock ? "不足" : "正常" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="openIo(1, row.material_id)"
            >
              入库
            </el-button>
            <el-button
              link
              type="warning"
              @click="openIo(2, row.material_id)"
            >
              出库
            </el-button>
            <el-button link type="info" @click="openTx(row.material_id)">
              流水
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

    <!-- 预警弹窗 -->
    <el-dialog v-model="warnDialog" title="库存预警" width="520px" class="dialog-md">
      <div class="flex flex-col gap-2">
        <div
          v-for="w in warnList"
          :key="w.id"
          class="flex items-center justify-between px-3 py-2 rounded-md text-sm"
          style="background: rgba(248, 81, 73, 0.06)"
        >
          <span>{{ w.material_name }}</span>
          <span class="text-xs text-dim">
            {{ w.quantity }} {{ w.unit }} / 预警值 {{ w.min_stock }}
          </span>
        </div>
      </div>
    </el-dialog>

    <!-- 出入库弹窗 -->
    <el-dialog
      v-model="ioDialog"
      :title="ioType === 1 ? '入库' : '出库'"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form :model="ioForm" label-width="80px">
        <el-form-item label="物料ID">
          <el-input v-model="ioForm.materialId" disabled />
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input v-model="ioForm.quantity" placeholder="请输入数量" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ioForm.remark" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ioDialog = false">取消</el-button>
        <el-button type="primary" @click="doIo">确认</el-button>
      </template>
    </el-dialog>

    <!-- 流水弹窗 -->
    <el-dialog v-model="txDialog" title="库存流水" width="600px" class="dialog-md">
      <el-table :data="txList" size="small" style="width: 100%">
        <el-table-column label="类型" width="70">
          <template #default="{ row }">
            <el-tag
              :type="row.transaction_type === 1 ? 'success' : 'warning'"
              size="small"
            >
              {{ row.transaction_type === 1 ? "入库" : "出库" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column
          prop="balance_after"
          label="变更后"
          width="80"
          align="center"
        />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
    </el-dialog>
  </div>
</template>
