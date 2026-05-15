<script setup lang="ts">
import { ref, onMounted } from "vue"; import { http } from "@/utils/http"; import { message } from "@/utils/message";
defineOptions({name:"TradeCheckin"});

const activeList=ref([]),availSessions=ref([]),searchCid=ref("");
const loadActive=async()=>{const r:any=await http.get("/gameSessions/list",{params:{status:1,page:1,size:50}});r?.success&&(activeList.value=r.data.list)};
const searchAvail=async()=>{if(!searchCid.value)return;const r:any=await http.get("/gameSessions/available",{params:{customersId:searchCid.value}});r?.success&&(availSessions.value = r.data||[])};
const checkin=async(csid:number)=>{const r:any=await http.post("/gameSessionsCheckin",{data:{customersId:searchCid.value,customerSessionId:csid}});r?.success?(message("核销成功",{type:"success"}),searchAvail(),loadActive()):message(r?.msg||"失败",{type:"warning"})};
const finish=async(gsid:number)=>{const r:any=await http.put("/gameSessionsFinish",{data:{gameSessionId:gsid}});r?.success?(message("已完成",{type:"success"}),loadActive()):message(r?.msg||"失败",{type:"warning"})};
onMounted(loadActive);
</script>
<template>
  <div class="page-container"><el-row :gutter="16">
    <el-col :span="10"><el-card shadow="never"><template #header>核销入座</template>
      <el-input v-model="searchCid" placeholder="输入顾客ID搜索可用次数" class="mb-2"/>
      <el-button type="primary" @click="searchAvail">搜索</el-button>
      <el-table :data="availSessions" stripe class="mt-2"><el-table-column prop="package_name" label="套餐"/>
        <el-table-column prop="session_date" label="有效日期"/>
        <el-table-column label="操作" width="80"><template #default="{row}"><el-button type="primary" size="small" @click="checkin(row.id)">核销</el-button></template></el-table-column>
      </el-table>
    </el-card></el-col>
    <el-col :span="14"><el-card shadow="never"><template #header>进行中 ({{activeList.length}})</template>
      <el-table :data="activeList" stripe><el-table-column prop="customer_name" label="顾客"/><el-table-column prop="staff_name" label="员工"/>
        <el-table-column prop="start_time" label="开始时间" width="170"/>
        <el-table-column label="操作" width="80"><template #default="{row}"><el-button type="warning" size="small" @click="finish(row.id)">结束</el-button></template></el-table-column>
      </el-table>
    </el-card></el-col>
  </el-row></div>
</template>
