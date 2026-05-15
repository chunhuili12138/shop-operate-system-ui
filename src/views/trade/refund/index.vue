<script setup lang="ts">
import { ref, onMounted } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
defineOptions({name:"TradeRefund"}); const T=ref([]),L=ref(false),P=ref(1),S=ref(20),t=ref(0),Q=ref({status:""});
const load=async()=>{L.value=true;try{const r:any=await http.get("/purchasesRefunds",{params:{page:P.value,size:S.value,...Q.value}});r?.success&&(T.value=r.data.list,t.value=r.data.total)}finally{L.value=false}};
const reset=()=>{Q.value={status:""};P.value=1;load()};
const onSizeChange=(s:number)=>{S.value=s;P.value=1;load()};
const approve=async(id:number)=>{const r:any=await http.put("/purchasesRefundsApprove",{data:{refundId:id}});r?.success?(message("已确认",{type:"success"}),load()):message(r?.msg||"失败",{type:"warning"})};
const reject=async(id:number)=>{const{value}=await ElMessageBox.prompt("输入拒绝原因","拒绝退款");if(value){const r:any=await http.put("/purchasesRefundsReject",{data:{refundId:id,reason:value}});r?.success?(message("已拒绝",{type:"success"}),load()):message(r?.msg||"失败",{type:"warning"})}};
onMounted(load);
</script>
<template>
  <div class="page-container">
    <div class="page-header"><el-form :model="Q" inline class="page-search">
      <el-form-item label="状态"><el-select v-model="Q.status" clearable style="width:120px"><el-option label="处理中" :value="1"/><el-option label="已完成" :value="2"/><el-option label="已拒绝" :value="3"/></el-select></el-form-item>
    </el-form>
    <div class="page-header-actions"><div></div><div><el-button type="primary" @click="load">查询</el-button><el-button @click="reset">重置</el-button></div></div></div>
    <div class="page-table"><el-table v-loading="L" :data="T" stripe border  style="width:100%">
      <el-table-column prop="purchase_id" label="购买ID" width="80"/><el-table-column prop="refund_amount" label="退款金额" width="100"/>
      <el-table-column prop="reason" label="原因" show-overflow-tooltip/><el-table-column label="状态" width="90"><template #default="{row}">{{['','处理中','已完成','已拒绝'][row.status]}}</template></el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="170"/>
      <el-table-column label="操作" width="160" fixed="right"><template #default="{row}">
        <el-button v-if="row.status===1" type="success" size="small" @click="approve(row.id)">确认</el-button>
        <el-button v-if="row.status===1" type="danger" size="small" @click="reject(row.id)">拒绝</el-button>
      </template></el-table-column>
    </el-table></div>
    <el-pagination v-model:current-page="P" v-model:page-size="S" :total="t" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="onSizeChange" @current-change="load" class="page-pagination"/>
  </div>
</template>
