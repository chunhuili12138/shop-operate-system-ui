<script setup lang="ts">
import { ref, onMounted, reactive } from "vue"; import { http } from "@/utils/http"; import { message } from "@/utils/message";
defineOptions({name:"FinanceInvoice"}); const T=ref([]),L=ref(false),P=ref(1),S=ref(20),t=ref(0);
const D=ref(false),F=reactive({referenceType:"purchase",referenceId:"",invoiceNumber:"",amount:"",issuedAt:""});
const load=async()=>{L.value=true;try{const r:any=await http.get("/invoices",{params:{page:P.value,size:S.value}});r?.success&&(T.value=r.data.list,t.value=r.data.total)}finally{L.value=false}};
const onSizeChange=(s:number)=>{S.value=s;P.value=1;load()};
const save=async()=>{const r:any=await http.post("/invoicesAdd",{data:F});r?.success?(message("成功",{type:"success"}),D.value=false,load()):message(r?.msg||"失败",{type:"warning"})};
onMounted(load);
</script>
<template>
  <div class="page-container">
    <div class="page-header"><div class="page-header-actions"><div><el-button type="success" @click="D=true;Object.assign(F,{referenceType:'purchase',referenceId:'',invoiceNumber:'',amount:'',issuedAt:''})">新增发票</el-button></div><div><el-button type="primary" @click="load">查询</el-button></div></div></div>
    <div class="page-table"><el-table v-loading="L" :data="T" stripe border  style="width:100%">
      <el-table-column prop="reference_type" label="关联类型" width="100"/><el-table-column prop="reference_id" label="关联ID" width="80"/>
      <el-table-column prop="invoice_number" label="发票号"/><el-table-column prop="amount" label="金额"/><el-table-column prop="issued_at" label="开票日期"/>
    </el-table></div>
    <el-pagination v-model:current-page="P" v-model:page-size="S" :total="t" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="onSizeChange" @current-change="load" class="page-pagination"/>
    <el-dialog v-model="D" title="新增发票" width="400px"><el-form :model="F" label-width="100px">
      <el-form-item label="关联类型"><el-select v-model="F.referenceType"><el-option label="采购" value="purchase"/><el-option label="购买" value="purchase_order"/></el-select></el-form-item>
      <el-form-item label="关联ID"><el-input v-model="F.referenceId"/></el-form-item><el-form-item label="发票号"><el-input v-model="F.invoiceNumber"/></el-form-item>
      <el-form-item label="金额"><el-input v-model="F.amount"/></el-form-item><el-form-item label="开票日期"><el-input v-model="F.issuedAt" placeholder="yyyy-MM-dd"/></el-form-item>
    </el-form><template #footer><el-button @click="D=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template></el-dialog>
  </div>
</template>
