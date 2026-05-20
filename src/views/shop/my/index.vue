<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { getMyShopInfo, updateMyShopStatus } from "@/api/shop";
import { formatDate } from "@/utils/date";
import EditFormDialog from "./components/EditFormDialog.vue";

defineOptions({ name: "ShopMy" });

const loading = ref(false);
const shop = ref<any>(null);
const dialogVisible = ref(false);

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
  dialogVisible.value = true;
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
        <!-- 上部分：左侧图片，右侧店铺信息 -->
        <div class="card-top">
          <!-- 左侧：招牌照片 -->
          <div class="card-left">
            <div class="sign-photo">
              <img
                v-if="shop.sign_photo"
                :src="`/api/file/image?name=${encodeURIComponent(shop.sign_photo)}`"
                alt="招牌照片"
              />
              <div v-else class="photo-placeholder">
                <span>暂无招牌照片</span>
              </div>
            </div>
          </div>

          <!-- 右侧:店铺信息 -->
          <div class="card-right">
            <!-- 标题行 -->
            <div class="info-header">
              <h2 class="shop-name">{{ shop.name }}</h2>
              <el-tag
                :type="shop.status === 1 ? 'success' : 'danger'"
                size="large"
                class="status-tag"
              >
                {{ shop.status === 1 ? "营业中" : "休息" }}
              </el-tag>
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
                <span class="info-label">描述</span>
                <span class="info-value info-desc">{{
                  shop.description || "暂无描述"
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 下部分：左侧创建时间，右侧操作按钮 -->
        <div class="card-bottom">
          <div class="created-time">
            <span class="time-label">创建时间：</span>
            <span class="time-value">{{ formatDate(shop.created_at) }}</span>
          </div>

          <div class="card-actions">
            <el-button
              v-auth="'btn:shop:myEdit'"
              type="primary"
              @click="openEdit"
            >
              编辑
            </el-button>
            <el-button
              v-auth="'btn:shop:myStatus'"
              :type="shop.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus"
            >
              {{ shop.status === 1 ? "设为休息" : "设为营业" }}
            </el-button>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else description="暂无店铺信息" />

    <!-- 编辑弹窗 -->
    <EditFormDialog v-model="dialogVisible" :shop-data="shop" @success="load" />
  </div>
</template>

<style scoped lang="scss">
.shop-my {
  padding: 24px;
  min-height: 100%;
  background: #f5f6fa;
}

.shop-card {
  width: fit-content;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #fff;
  border-radius: 10px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ---- 上部分：图片+信息 ---- */
.card-top {
  display: flex;
  gap: 28px;
}

/* ---- 左侧招牌照片 ---- */
.card-left {
  flex-shrink: 0;
  width: 350px;
}

.sign-photo {
  width: 350px;
  aspect-ratio: 4 / 3;
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

.created-time {
  font-size: 13px;
  color: #86909c;

  .time-label {
    color: #86909c;
  }

  .time-value {
    color: #4e5969;
  }
}

/* ---- 右侧信息 ---- */
.card-right {
  flex: 1;
  min-width: 350px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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

/* ---- 下部分：时间+按钮 ---- */
.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* ---- 底部操作按钮 ---- */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
