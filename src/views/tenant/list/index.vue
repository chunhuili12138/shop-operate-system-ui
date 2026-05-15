<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";
import type { FormInstance } from "element-plus";

defineOptions({ name: "TenantList" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const query = reactive({ keyword: "", banStatus: "" as any });

// ---- 席位 ----
const seatDialog = ref(false);
const seatStaffId = ref(0);
const seats = ref([]);
const seatAddDialog = ref(false);
const seatForm = reactive({
  staffId: 0,
  subscriptionType: 1,
  subscriptionNum: 1,
  amount: 0,
  paymentMethod: ""
});
const seatRenewDialog = ref(false);
const seatRenewForm = reactive({
  seatId: "",
  subscriptionType: 1,
  subscriptionNum: 1,
  amount: 0,
  paymentMethod: ""
});

// ---- 流水 ----
const txDialog = ref(false);
const txList = ref([]);

// ---- 商户表单 ----
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  staffId: null as number | null,
  name: "",
  phone: "",
  username: "",
  password: "",
  maxSeats: null as number | null,
  remark: ""
});

// ---- 重置密码 ----
const pwdDialog = ref(false);
const pwdStaffId = ref(0);
const newPwd = ref("");

const load = async () => {
  loading.value = true;
  try {
    const r: any = await http.get("/admin/tenants/page", {
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
  query.banStatus = "";
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
    staffId: null,
    name: "",
    phone: "",
    username: "",
    password: "",
    maxSeats: null,
    remark: ""
  });
  dialogVisible.value = true;
};

const openEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(form, {
    staffId: row.id,
    name: row.name,
    phone: row.phone,
    username: "",
    password: "",
    maxSeats: null,
    remark: row.remark
  });
  dialogVisible.value = true;
};

const save = async () => {
  const url = isEdit.value ? "/admin/tenants/update" : "/admin/tenants/add";
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

const openResetPwd = (id: number) => {
  pwdStaffId.value = id;
  newPwd.value = "";
  pwdDialog.value = true;
};

const doResetPwd = async () => {
  if (!newPwd.value) return;
  const r: any = await http.post("/admin/tenants/password", {
    data: { staffId: pwdStaffId.value, newPassword: newPwd.value }
  });
  if (r?.success) {
    message("密码已重置", { type: "success" });
    pwdDialog.value = false;
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openSeat = async (id: number) => {
  seatStaffId.value = id;
  const r: any = await http.get("/admin/tenants/seatList", {
    params: { staffId: id }
  });
  if (r?.success) seats.value = r.data || [];
  seatDialog.value = true;
};

const openSeatAdd = (staffId: number) => {
  Object.assign(seatForm, {
    staffId,
    subscriptionType: 1,
    subscriptionNum: 1,
    amount: "",
    paymentMethod: ""
  });
  seatAddDialog.value = true;
};

const doSeatAdd = async () => {
  const r: any = await http.post("/admin/tenants/seatAdd", { data: seatForm });
  if (r?.success) {
    message("席位已添加", { type: "success" });
    seatAddDialog.value = false;
    openSeat(seatStaffId.value);
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openSeatRenew = (row: any) => {
  Object.assign(seatRenewForm, {
    seatId: row.id,
    subscriptionType: 1,
    subscriptionNum: 1,
    amount: "",
    paymentMethod: ""
  });
  seatRenewDialog.value = true;
};

const doSeatRenew = async () => {
  const r: any = await http.post("/admin/tenants/seatRenew", {
    data: seatRenewForm
  });
  if (r?.success) {
    message("续订成功", { type: "success" });
    seatRenewDialog.value = false;
    openSeat(seatStaffId.value);
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const doSeatDel = async (id: number) => {
  await import("element-plus").then(m =>
    m.ElMessageBox.confirm("确认删除？", "提示")
  );
  const r: any = await http.delete("/admin/tenants/seatDelete", {
    params: { seatId: id }
  });
  if (r?.success) {
    message("已删除", { type: "success" });
    openSeat(seatStaffId.value);
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const openTx = async (id: number) => {
  const r: any = await http.get("/admin/tenants/subscriptionTransactionList", {
    params: { staffId: id }
  });
  if (r?.success) txList.value = r.data || [];
  txDialog.value = true;
};

const doDelete = async (id: number) => {
  await import("element-plus").then(m =>
    m.ElMessageBox.confirm("确认删除？", "提示")
  );
  const r: any = await http.delete("/admin/tenants/delete", {
    params: { staffId: id }
  });
  if (r?.success) {
    message("已删除", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

const toggleBan = async (id: number, isBan: number) => {
  const r: any = await http.put("/admin/tenants/ban", {
    data: { staffId: id, banStatus: isBan ? 0 : 1 }
  });
  if (r?.success) {
    message("操作成功", { type: "success" });
    load();
  } else {
    message(r?.msg || "失败", { type: "warning" });
  }
};

// ---- 字典 ----
const paymentMethods = ref([] as any[]);
const loadPaymentMethods = async () => {
  try {
    const r: any = await http.get("/system/dict/data", {
      params: { dictCode: "payment_method" }
    });
    if (r?.success) paymentMethods.value = r.data || [];
  } catch {
    /* ignore */
  }
};

onMounted(() => {
  load();
  loadPaymentMethods();
});
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
            style="width: 200px"
            placeholder="商户名称/手机号"
            @keyup.enter="load"
          />
        </el-form-item>
        <el-form-item label="封禁状态">
          <el-select
            v-model="query.banStatus"
            clearable
            style="width: 150px"
            placeholder="全部"
          >
            <el-option label="正常" :value="0" />
            <el-option label="封禁" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="page-header-actions">
        <div>
          <el-button type="primary" @click="openAdd">新增商户</el-button>
        </div>
        <div>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 表格区 -->
    <div class="page-table">
      <el-table v-loading="loading" :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="商户名称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="席位数" width="120">
          <template #default="{ row }">
            {{ row.used_seats || 0 }} / {{ row.max_seats || 0 }}
          </template>
        </el-table-column>
        <el-table-column
          prop="shop_count"
          label="店铺数"
          width="70"
          align="center"
        />
        <el-table-column prop="role_names" label="角色" width="120">
          <template #default="{ row }">
            <span class="text-sm text-dim">{{ row.role_names || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_ban ? 'danger' : 'success'" size="small">
              {{ row.is_ban ? "封禁" : "正常" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button link type="primary" @click="openSeat(row.id)"
              >席位</el-button
            >
            <el-button link type="primary" @click="openTx(row.id)"
              >流水</el-button
            >
            <el-button link type="primary" @click="openResetPwd(row.id)"
              >重置密码</el-button
            >
            <el-button
              link
              :type="row.is_ban ? 'success' : 'warning'"
              @click="toggleBan(row.id, row.is_ban)"
            >
              {{ row.is_ban ? "解封" : "封禁" }}
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

    <!-- 席位管理弹窗 -->
    <el-dialog
      v-model="seatDialog"
      title="席位管理"
      width="750px"
      class="dialog-lg"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="flex-bc">
          <span>席位管理</span>
          <el-button
            size="small"
            type="primary"
            @click="openSeatAdd(seatStaffId)"
          >
            新增席位
          </el-button>
        </div>
      </template>
      <el-table :data="seats" style="width: 100%">
        <el-table-column prop="start_date" label="生效" width="120" />
        <el-table-column prop="end_date" label="到期" width="120" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? "生效中" : "已到期" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shop_names" label="关联店铺" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              link
              type="primary"
              @click="openSeatRenew(row)"
            >
              续订
            </el-button>
            <el-button link type="danger" @click="doSeatDel(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 流水弹窗 -->
    <el-dialog
      v-model="txDialog"
      title="席位流水"
      width="600px"
      class="dialog-lg"
    >
      <el-table :data="txList" style="width: 100%">
        <el-table-column prop="amount" label="金额" />
        <el-table-column prop="payment_method" label="支付方式" />
        <el-table-column label="类型">
          <template #default="{ row }">
            {{ row.subscription_type === 1 ? "月付" : "年付" }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
    </el-dialog>

    <!-- 商户表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商户' : '新增商户'"
      width="500px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码 -->
    <el-dialog
      v-model="pwdDialog"
      title="重置密码"
      width="400px"
      class="dialog-xs"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="新密码">
          <el-input v-model="newPwd" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog = false">取消</el-button>
        <el-button type="primary" @click="doResetPwd">确认重置</el-button>
      </template>
    </el-dialog>

    <!-- 新增席位 -->
    <el-dialog
      v-model="seatAddDialog"
      title="新增席位"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form :model="seatForm" label-width="100px">
        <el-form-item label="类型">
          <el-select v-model="seatForm.subscriptionType" style="width: 100%">
            <el-option label="月付" :value="1" />
            <el-option label="年付" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="seatForm.subscriptionNum"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="seatForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select
            v-model="seatForm.paymentMethod"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="pm in paymentMethods"
              :key="pm.dict_key"
              :label="pm.dict_value"
              :value="pm.dict_label"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="seatAddDialog = false">取消</el-button>
        <el-button type="primary" @click="doSeatAdd">保存</el-button>
      </template>
    </el-dialog>

    <!-- 续订席位 -->
    <el-dialog
      v-model="seatRenewDialog"
      title="续订席位"
      width="440px"
      class="dialog-sm"
      :close-on-click-modal="false"
    >
      <el-form :model="seatRenewForm" label-width="100px">
        <el-form-item label="类型">
          <el-select
            v-model="seatRenewForm.subscriptionType"
            style="width: 100%"
          >
            <el-option label="月付" :value="1" />
            <el-option label="年付" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="seatRenewForm.subscriptionNum"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="seatRenewForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select
            v-model="seatRenewForm.paymentMethod"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="pm in paymentMethods"
              :key="pm.dict_key"
              :label="pm.dict_value"
              :value="pm.dict_label"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="seatRenewDialog = false">取消</el-button>
        <el-button type="primary" @click="doSeatRenew">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
