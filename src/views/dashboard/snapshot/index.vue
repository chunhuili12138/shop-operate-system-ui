<script setup lang="ts">
import { ref, onMounted } from "vue"; import { http } from "@/utils/http";
defineOptions({name:"DashboardSnapshot"}); const T=ref([]),L=ref(false),P=ref(1),S=ref(20),t=ref(0);
const load=async()=>{L.value=true;try{const r:any=await http.get("/dailySnapshots",{params:{page:P.value,size:S.value}});r?.success&&(T.value=r.data.list,t.value=r.data.total)}finally{L.value=false}};
const onSizeChange=(s:number)=>{S.value=s;P.value=1;load()};
onMounted(load);
</script>
<template>
  <div class="page-container">
    
    <div class="page-table"><el-table v-loading="L" :data="T" stripe border  style="width:100%">
      <el-table-column prop="snapshot_date" label="日期" width="120"/><el-table-column prop="sales_total" label="销售额"/><el-table-column prop="revenue_confirmed" label="确认收入"/>
      <el-table-column prop="new_customers" label="新顾客" width="70"/><el-table-column prop="active_sessions" label="活跃session" width="100"/>
      <el-table-column prop="average_duration" label="平均时长(分)" width="110"/>
    </el-table></div>
    <el-pagination v-model:current-page="P" v-model:page-size="S" :total="t" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="onSizeChange" @current-change="load" class="page-pagination"/>
  </div>
</template>
