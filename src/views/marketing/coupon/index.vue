<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";

defineOptions({ name: "MktCoupon" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "" });

const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({
  couponId: null as number | null,
  name: "",
  type: 1,
  value: "",
  minOrderAmount: "0",
  totalStock: 0,
  validDays: 30
});

const usageDialog = ref(false);
const usageList = ref([]);
const grantDialog = ref(false);
const grantCouponId = ref(0);
const grantIds = ref("");

const load = async () => {
  loading.value = true;
  try {
    const r: any = await http.get("/coupons", {
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
  page.value = 1;
  load();
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openAdd = () => {
  dialogVisible.value = true;
  isEdit.value = false;
  Object.assign(form, {
    couponId: null,
    name: "",
    type: 1,
    value: "",
    minOrderAmount: "0",
    totalStock: 0,
    validDays: 30
  });
};

const openEdit = (row: any) => {
  dialogVisible.value = true;
  isEdit.value = true;
  Object.assign(form, {
    couponId: row.id,
    name: row.name,
    type: row.type,
    value: row.value,
    minOrderAmount: row.min_order_amount,
    totalStock: row.total_stock,
    validDays: row.valid_days
  });
};

const save = async () => {
  const url = isEdit.value ? "/couponsUpdate" : "/couponsAdd";
  const method = isEdit.value ? "put" : "post";
  const r: any = await http.request(method, url, { data: form });
  if (r?.success) {
    message("保存成功", { type: "success" });
    dialogVisible.value = false;
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const toggle = (id: number, active: number) => {
  http
    .put("/couponsStatus", {
      data: { couponId: id, isActive: active ? 0 : 1 }
    })
    .then((r: any) => {
      if (r?.success) {
        message("已切换", { type: "success" });
        load();
      } else {
        message(r?.msg || "失败", { type: "warning" });
      }
    });
};

const openUsage = async (id: number) => {
  const r: any = await http.get("/couponUsages", {
    params: { couponId: id, page: 1, size: 50 }
  });
  if (r?.success) usageList.value = r.data.list;
  usageDialog.value = true;
};

const openGrant = (id: number) => {
  grantCouponId.value = id;
  grantIds.value = "";
  grantDialog.value = true;
};

const doGrant = async () => {
  if (!grantIds.value) return;
  const r: any = await http.post("/couponUsagesGrant", {
    data: { couponId: grantCouponId.value, customerIds: grantIds.value }
  });
  if (r?.success) {
    message("已发放", { type: "success" });
    grantDialog.value = false;
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
            clearable
            placeholder="优惠券名称"
            style="width:200px"
            @keyup.enter="load"
          />
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增优惠券</el-button>
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
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            {{ ["", "固定金额", "百分比", "兑换券"][row.type] }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="面值" width="80" align="center" />
        <el-table-column prop="total_stock" label="库存" width="60" align="center" />
        <el-table-column prop="remain_stock" label="剩余" width="60" align="center" />
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openUsage(row.id)">
              使用记录
            </el-button>
            <el-button link type="primary" @click="openGrant(row.id)">发放</el-button>
            <el-button
              link
              :type="row.is_active ? 'warning' : 'success'"
              @click="toggle(row.id, row.is_active)"
            >
              {{ row.is_active ? "禁用" : "启用" }}
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

    <!-- 优惠券表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑优惠券' : '新增优惠券'"
      width="520px"
      class="dialog-md"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="固定金额" :value="1" />
            <el-option label="百分比" :value="2" />
            <el-option label="兑换券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="面值">
          <el-input v-model="form.value" />
        </el-form-item>
        <el-form-item label="最低消费">
          <el-input v-model="form.minOrderAmount" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.totalStock" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="有效期(天)">
          <el-input-number v-model="form.validDays" :min="1" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 使用记录弹窗 -->
    <el-dialog v-model="usageDialog" title="使用记录" width="600px" class="dialog-md">
      <el-table :data="usageList" style="width: 100%">
        <el-table-column prop="customer_name" label="顾客" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'info' : row.status === 2 ? 'success' : 'warning'"
              size="small"
            >
              {{ ["", "未使用", "已使用", "已过期"][row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="received_at" label="领取时间" width="170" />
        <el-table-column prop="expires_at" label="过期时间" width="170" />
      </el-table>
    </el-dialog>

    <!-- 发放弹窗 -->
    <el-dialog
      v-model="grantDialog"
      title="手动发放优惠券"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="顾客IDs">
          <el-input v-model="grantIds" placeholder="输入顾客ID，逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grantDialog = false">取消</el-button>
        <el-button type="primary" @click="doGrant">确认发放</el-button>
      </template>
    </el-dialog>
  </div>
</template>
