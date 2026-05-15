<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";
import { ElMessageBox } from "element-plus";
import {
  getShopList,
  getShopInfo,
  addShop,
  updateShop,
  updateShopStatus,
  deleteShop
} from "@/api/shop";
import { getUnboundSeats } from "@/api/tenant";
defineOptions({ name: "ShopList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", status: "" as any });

const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  shopsId: null as number | null,
  name: "",
  address: "",
  contactPhone: "",
  maxCapacity: null as number | null,
  description: "",
  seatId: ""
});

const seatOptions = ref([] as any[]);

const load = async () => {
  loading.value = true;
  try {
    const r = await getShopList({
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
  query.status = "";
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const toggle = async (id: number, status: number) => {
  const r = await updateShopStatus({
    shopsId: id,
    status: status ? 0 : 1
  });
  if (r?.success) {
    message("已切换", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const doDelete = async (id: number) => {
  await ElMessageBox.confirm("确认删除？", "提示");
  const r = await deleteShop(id);
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openAdd = async () => {
  isEdit.value = false;
  Object.assign(form, {
    shopsId: null,
    name: "",
    address: "",
    contactPhone: "",
    maxCapacity: null,
    description: "",
    seatId: ""
  });
  const r = await getUnboundSeats();
  if (r?.success) seatOptions.value = r.data || [];
  dialogVisible.value = true;
};

const openEdit = async (id: number) => {
  const r = await getShopInfo(id);
  if (r?.success) {
    const d = r.data;
    Object.assign(form, {
      shopsId: d.id,
      name: d.name,
      address: d.address,
      contactPhone: d.contact_phone,
      maxCapacity: d.max_capacity,
      description: d.description,
      seatId: ""
    });
    isEdit.value = true;
    dialogVisible.value = true;
  }
};

const save = async () => {
  const r = isEdit.value 
    ? await updateShop(form)
    : await addShop(form);
  if (r?.success) {
    message("保存成功", { type: "success" });
    dialogVisible.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
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
            placeholder="店铺名称/手机号"
            clearable
            style="width:180px"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="营业状态">
          <el-select
            v-model="query.status"
            clearable
            placeholder="全部"
            style="width:120px"
          >
            <el-option label="营业中" :value="1" />
            <el-option label="休息" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">
            + 新增店铺
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
      >
        <el-table-column prop="name" label="店铺名称" min-width="150" />
        <el-table-column prop="owner_name" label="所属商户" width="120" />
        <el-table-column prop="contact_phone" label="电话" width="130" />
        <el-table-column
          prop="address"
          label="地址"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column label="营业状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "营业中" : "休息" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row.id)">
              编辑
            </el-button>
            <el-button
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggle(row.id, row.status)"
            >
              {{ row.status === 1 ? "设为休息" : "设为营业" }}
            </el-button>
            <el-button link type="danger" @click="doDelete(row.id)">
              删除
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

    <!-- 表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑店铺' : '新增店铺'"
      width="520px"
      class="dialog-md"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="店铺名称" required>
          <el-input v-model="form.name" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="关联席位" required>
          <el-select v-model="form.seatId" placeholder="请选择席位" style="width:100%">
            <el-option
              v-for="s in seatOptions"
              :key="s.id"
              :label="`${s.seat_no} (${s.staff_name})`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number
            v-model="form.maxCapacity"
            :min="1"
            placeholder="不限"
            style="width:100%"
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
