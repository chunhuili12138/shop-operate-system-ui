<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";

defineOptions({ name: "PackageList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", type: "", status: "" });

const dialogVisible = ref(false);
const isEdit = ref(false);
const bomDialog = ref(false);
const bomList = ref([]);

const form = reactive({
  packageId: null as number | null,
  name: "",
  type: 1,
  durationMinutes: null as number | null,
  price: "",
  maxPeoplePerSession: 1,
  description: "",
  bom: [] as any[]
});

const load = async () => {
  loading.value = true;
  try {
    const r: any = await http.get("/packages/page", {
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
  query.type = "";
  query.status = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    packageId: null,
    name: "",
    type: 1,
    durationMinutes: null,
    price: "",
    maxPeoplePerSession: 1,
    description: "",
    bom: []
  });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    packageId: row.id,
    name: row.name,
    type: row.type,
    durationMinutes: row.duration_minutes,
    price: row.price,
    maxPeoplePerSession: row.max_people_per_session,
    description: row.description,
    bom: []
  });
  dialogVisible.value = true;
};

const save = async () => {
  const url = isEdit.value ? "/packages/update" : "/packages/add";
  const method = isEdit.value ? "put" : "post";
  const r: any = await http.request(method, url, {
    data: { ...form, bom: JSON.stringify(form.bom) }
  });
  if (r?.success) {
    message("保存成功", { type: "success" });
    dialogVisible.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const toggle = async (id: number, status: number) => {
  const r: any = await http.put("/packages/status", {
    data: { packageId: id, isActive: status ? 0 : 1 }
  });
  if (r?.success) {
    message("已切换", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openBom = async (id: number) => {
  const r: any = await http.get("/packages/bom", {
    params: { packagesId: id }
  });
  if (r?.success) bomList.value = r.data || [];
  bomDialog.value = true;
};

const addBomRow = () => form.bom.push({ materialId: "", quantity: 1 });

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
            clearable
            placeholder="套餐名称"
            style="width:180px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" clearable placeholder="全部" style="width:100px">
            <el-option label="单次" :value="1" />
            <el-option label="周卡" :value="2" />
            <el-option label="月卡" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增套餐</el-button>
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
        <el-table-column prop="name" label="套餐名" min-width="120" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            {{ ["", "单次", "周卡", "月卡"][row.type] }}
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="时长(分)" width="80" align="center" />
        <el-table-column prop="price" label="价格" width="80" align="center" />
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? "上架" : "下架" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openBom(row.id)">BOM</el-button>
            <el-button
              link
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggle(row.id, row.is_active)"
            >
              {{ row.is_active ? "下架" : "上架" }}
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

    <!-- 套餐表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑套餐' : '新增套餐'"
      width="600px"
      class="dialog-md"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="单次" :value="1" />
            <el-option label="周卡" :value="2" />
            <el-option label="月卡" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长(分)">
          <el-input-number v-model="form.durationMinutes" style="width:100%" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input v-model="form.price" />
        </el-form-item>
        <el-form-item label="最大人数">
          <el-input-number v-model="form.maxPeoplePerSession" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="物料清单">
          <div class="flex-bc mb-2">
            <span class="text-sm text-dim">关联物料及用量</span>
            <el-button size="small" @click="addBomRow">+ 添加物料</el-button>
          </div>
          <div
            v-for="(b, i) in form.bom"
            :key="i"
            class="flex gap-2 mt-1 items-center"
          >
            <el-input v-model="b.materialId" placeholder="物料ID" style="width:140px" />
            <el-input-number v-model="b.quantity" :min="1" style="width:100px" />
            <el-button size="small" type="danger" plain @click="form.bom.splice(i, 1)">
              删除
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- BOM 弹窗 -->
    <el-dialog v-model="bomDialog" title="物料清单" width="500px" class="dialog-sm">
      <el-table :data="bomList" style="width: 100%">
        <el-table-column prop="material_name" label="物料" />
        <el-table-column prop="quantity" label="用量" width="80" />
        <el-table-column prop="unit" label="单位" width="80" />
      </el-table>
    </el-dialog>
  </div>
</template>
