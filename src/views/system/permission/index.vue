<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPermissionList } from "@/api/system";
defineOptions({ name: "SystemPermission" });
const treeData = ref([]);
const loadData = async () => {
  const r = await getPermissionList();
  if (r?.success) treeData.value = r.data;
};
onMounted(loadData);
</script>
<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-tree
        :data="treeData"
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
      >
        <template #default="{ data }">
          <span class="flex items-center gap-2"
            ><span>{{ data.name }}</span>
            <el-tag
              :type="
                data.type === 1 ? '' : data.type === 2 ? 'warning' : 'info'
              "
              size="small"
              >{{
                data.type === 1 ? "目录" : data.type === 2 ? "菜单" : "按钮"
              }}</el-tag
            >
            <span class="text-gray-400 text-xs">{{ data.menuCode }}</span>
          </span>
        </template>
      </el-tree>
    </el-card>
  </div>
</template>
