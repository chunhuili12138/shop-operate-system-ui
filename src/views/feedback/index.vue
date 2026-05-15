<script setup lang="ts">
import { ref, onMounted } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";

defineOptions({ name: "Feedback" });

const tableData = ref([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);

const dialogVisible = ref(false);
const detail = ref<any>({});
const replyText = ref("");

const load = async () => {
  loading.value = true;
  try {
    const r: any = await http.get("/feedbacks/page", {
      params: { page: page.value, size: size.value }
    });
    if (r?.success) {
      tableData.value = r.data.list;
      total.value = r.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const onSizeChange = (s: number) => {
  size.value = s;
  page.value = 1;
  load();
};

const openDetail = async (id: number) => {
  const r: any = await http.get("/feedbacks/info", {
    params: { feedbackId: id }
  });
  if (r?.success) detail.value = r.data;
  dialogVisible.value = true;
};

const reply = async () => {
  const r: any = await http.put("/feedbacks/reply", {
    data: { feedbackId: detail.value.id, replyContent: replyText.value }
  });
  if (r?.success) {
    message("已回复", { type: "success" });
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
    <!-- 表格区（无搜索） -->
    <div class="page-table">
      <el-table
        v-loading="loading"
        :data="tableData"
                style="width: 100%"
      >
        <el-table-column prop="customer_name" label="顾客" width="120" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            {{ ["", "满意度", "建议", "投诉", "其他"][row.feedback_type] }}
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="60" align="center" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 1 ? 'warning' : row.status === 2 ? 'success' : 'info'
              "
              size="small"
            >
              {{ ["", "待处理", "已回复", "已关闭"][row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)">
              查看
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="dialogVisible" title="反馈详情" width="500px" class="dialog-sm">
      <p><b>内容：</b>{{ detail.content }}</p>
      <p v-if="detail.rating"><b>评分：</b>{{ detail.rating }} 星</p>
      <p v-if="detail.reply_content"><b>回复：</b>{{ detail.reply_content }}</p>
      <div v-if="detail.status === 1" class="mt-4">
        <el-input
          v-model="replyText"
          type="textarea"
          placeholder="输入回复内容"
        />
        <el-button type="primary" class="mt-2" @click="reply">回复</el-button>
      </div>
    </el-dialog>
  </div>
</template>
