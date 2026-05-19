<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getMyShopInfo,
  updateMyShop,
  updateMyShopStatus
} from "@/api/shop";

defineOptions({ name: "ShopMy" });

const loading = ref(false);
const saving = ref(false);
const shop = ref<any>(null);

const dialogVisible = ref(false);
const editForm = reactive({
  name: "",
  address: "",
  contactPhone: "",
  maxCapacity: null as number | null,
  description: ""
});

const load = async () => {
  loading.value = true;
  try {
    const r: any = await getMyShopInfo();
    if (r?.success) {
      shop.value = r.data;
    } else {
      message(r?.msg || "加载失败", { type: "warning" });
    }
  } finally {
    loading.value = false;
  }
};

const openEdit = () => {
  editForm.name = shop.value?.name || "";
  editForm.address = shop.value?.address || "";
  editForm.contactPhone = shop.value?.contact_phone || "";
  editForm.maxCapacity = shop.value?.max_capacity ?? null;
  editForm.description = shop.value?.description || "";
  dialogVisible.value = true;
};

const doEdit = async () => {
  saving.value = true;
  try {
    const r: any = await updateMyShop({
      name: editForm.name,
      address: editForm.address,
      contactPhone: editForm.contactPhone,
      maxCapacity: editForm.maxCapacity ?? undefined,
      description: editForm.description
    });
    if (r?.success) {
      message("保存成功", { type: "success" });
      dialogVisible.value = false;
      load();
    } else {
      message(r?.msg || "保存失败", { type: "warning" });
    }
  } finally {
    saving.value = false;
  }
};

const toggleStatus = async () => {
  const currentStatus = shop.value?.status;
  const actionText = currentStatus === 1 ? "休息" : "营业";
  const newStatus = currentStatus === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(`确认将店铺设为"${actionText}"？`, "提示");
  } catch {
    return;
  }
  const r: any = await updateMyShopStatus(newStatus);
  if (r?.success) {
    message(`已设为${actionText}`, { type: "success" });
    load();
  } else {
    message(r?.msg || "操作失败", { type: "warning" });
  }
};

onMounted(load);
</script>

<template>
  <div class="page-container shop-my">
    <div v-loading="loading" class="shop-detail-card">
      <template v-if="shop">
        <div class="card-header">
          <div class="card-title">
            <h2>{{ shop.name }}</h2>
            <el-tag
              :type="shop.status === 1 ? 'success' : 'danger'"
              size="large"
            >
              {{ shop.status === 1 ? "营业中" : "休息" }}
            </el-tag>
          </div>
          <div class="card-actions">
            <el-button
              v-auth="'btn:shop:edit'"
              type="primary"
              @click="openEdit"
            >
              编辑
            </el-button>
            <el-button
              v-auth="'btn:shop:status'"
              :type="shop.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus"
            >
              {{ shop.status === 1 ? "设为休息" : "设为营业" }}
            </el-button>
          </div>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="店铺名称" :span="2">
            {{ shop.name }}
          </el-descriptions-item>
          <el-descriptions-item label="所属商户">
            {{ shop.owner_name || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ shop.contact_phone || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">
            {{ shop.address || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="最大容量">
            {{ shop.max_capacity ?? "-" }} 人
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ shop.created_at || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ shop.description || "暂无描述" }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="shop.sign_photo" class="shop-sign-photo">
          <h4>招牌照片</h4>
          <el-image
            :src="shop.sign_photo"
            style="max-width: 300px"
            fit="contain"
            :preview-src-list="[shop.sign_photo]"
          />
        </div>
      </template>

      <el-empty v-else description="暂无店铺信息" />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑店铺信息"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="店铺名称">
          <el-input v-model="editForm.name" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="editForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number v-model="editForm.maxCapacity" :min="1" :max="999" placeholder="最大容量" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="doEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.shop-my {
  padding: 20px 24px;
  min-height: 100%;
  background: #f5f6fa;
}

.shop-detail-card {
  max-width: 860px;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.card-actions {
  display: flex;
  gap: 8px;
}

.shop-sign-photo {
  margin-top: 20px;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    color: #666;
  }
}
</style>
