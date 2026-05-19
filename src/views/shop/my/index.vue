<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getMyShopInfo, updateMyShop, updateMyShopStatus } from "@/api/shop";

defineOptions({ name: "ShopMy" });

const loading = ref(false);
const saving = ref(false);
const shop = ref<any>(null);

const signPhotoSrc = computed(() => {
  if (!shop.value?.sign_photo) return "";
  return `/file/image?name=${encodeURIComponent(shop.value.sign_photo)}`;
});

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
  <div v-loading="loading" class="shop-my">
    <template v-if="shop">
      <div class="shop-card">
        <!-- 左侧：招牌照片 -->
        <div class="card-left">
          <div class="sign-photo">
            <img v-if="shop.sign_photo" :src="signPhotoSrc" alt="招牌照片" />
            <div v-else class="photo-placeholder">
              <span>暂无招牌照片</span>
            </div>
          </div>
        </div>

        <!-- 右侧：店铺信息 -->
        <div class="card-right">
          <!-- 标题行 -->
          <div class="info-header">
            <div class="header-left">
              <h2 class="shop-name">{{ shop.name }}</h2>
              <el-tag
                :type="shop.status === 1 ? 'success' : 'danger'"
                size="large"
                class="status-tag"
              >
                {{ shop.status === 1 ? "营业中" : "休息" }}
              </el-tag>
            </div>
            <div class="header-actions">
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

          <!-- 信息列表 -->
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">所属商户</span>
              <span class="info-value">{{ shop.owner_name || "-" }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">联系电话</span>
              <span class="info-value">{{ shop.contact_phone || "-" }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">地址</span>
              <span class="info-value">{{ shop.address || "-" }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">最大容量</span>
              <span class="info-value">{{
                shop.max_capacity ? shop.max_capacity + " 人" : "-"
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ shop.created_at || "-" }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">描述</span>
              <span class="info-value info-desc">{{
                shop.description || "暂无描述"
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else description="暂无店铺信息" />

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
          <el-input
            v-model="editForm.contactPhone"
            placeholder="请输入联系电话"
          />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="editForm.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number
            v-model="editForm.maxCapacity"
            :min="1"
            :max="999"
            placeholder="最大容量"
          />
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
        <el-button type="primary" :loading="saving" @click="doEdit"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.shop-my {
  padding: 24px;
  min-height: 100%;
  background: #f5f6fa;
}

.shop-card {
  max-width: 820px;
  display: flex;
  gap: 28px;
  background: #fff;
  border-radius: 10px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ---- 左侧招牌照片 ---- */
.card-left {
  flex-shrink: 0;
  width: 200px;
}

.sign-photo {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #bbb;
  font-size: 14px;
}

/* ---- 右侧信息 ---- */
.card-right {
  flex: 1;
  min-width: 0;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shop-name {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1d2129;
}

.status-tag {
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ---- 信息字段 ---- */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  line-height: 1.6;
}

.info-label {
  flex-shrink: 0;
  width: 80px;
  color: #86909c;
  font-size: 14px;
}

.info-value {
  color: #1d2129;
  font-size: 14px;
  word-break: break-all;
}

.info-desc {
  color: #4e5969;
}
</style>
