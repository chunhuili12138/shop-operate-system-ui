<script setup lang="ts">
import { ref, onMounted, reactive } from "vue"; import { http } from "@/utils/http"; import { message } from "@/utils/message";
defineOptions({name:"InvPurchase"}); const T=ref([]),L=ref(false),P=ref(1),S=ref(20),t=ref(0),Q=reactive({status:""as any});
const D=ref(false),suppliers=ref([]),F=reactive({supplierId:"",orderDate:"",type:1,remark:"",items:[]as any[]});
const itemsVis=ref(false),itemsList=ref([]);
const load=async()=>{L.value=true;try{const r:any=await http.get("/purchaseOrders",{params:{page:P.value,size:S.value,...Q}});r?.success&&(T.value=r.data.list,t.value=r.data.total)}finally{L.value=false}};
const reset=()=>{Q.status="";P.value=1;load()};
const onSizeChange=(s:number)=>{S.value=s;P.value=1;load()};
const loadSup=async()=>{await http.get("/suppliers",{params:{page:1,size:999}}).then((r:any)=>{if(r?.success)suppliers.value=r.data.list})};
const openAdd=()=>{Object.assign(F,{supplierId:"",orderDate:"",type:1,remark:"",items:[]});loadSup();D.value=true};
const addItem=()=>F.items.push({materialId:"",quantity:1,unitPrice:"0"});
const save=async()=>{const r:any=await http.post("/purchaseOrdersAdd",{data:{...F,items:JSON.stringify(F.items)}});r?.success?(message("成功",{type:"success"}),D.value=false,load()):message(r?.msg||"失败",{type:"warning"})};
const updateStatus=async(id:number,st:number)=>{const r:any=await http.put("/purchaseOrdersStatus",{data:{orderId:id,status:st}});r?.success?(message("已更新",{type:"success"}),load()):message(r?.msg||"失败",{type:"warning"})};
const openItems=async(id:number)=>{const r:any=await http.get("/purchaseOrdersItems",{params:{orderId:id}});r?.success&&(itemsList.value = r.data||[]);itemsVis.value=true};
const payOrder=async(id:number)=>{const{v}=await import("element-plus").then(m=>m.ElMessageBox.prompt("输入付款金额","付款"));if(v){const r:any=await http.post("/purchaseOrdersPay",{data:{orderId:id,amount:v,paymentMethod:"cash",paidAt:new Date().toISOString().split("T")[0]}});r?.success?(message("已付款",{type:"success"}),load()):message(r?.msg||"失败",{type:"warning"})}};
onMounted(load);
</script>
<template>
  <div class="page-container">
    <div class="page-header"><el-form :model="Q" inline class="page-search">
      <el-form-item label="状态"><el-select v-model="Q.status" clearable style="width:120px"><el-option label="进行中" :value="1"/><el-option label="已完成" :value="2"/><el-option label="已取消" :value="3"/></el-select></el-form-item>
    </el-form>
    <div class="page-header-actions"><div><el-button type="success" @click="openAdd">新增采购单</el-button></div><div><el-button type="primary" @click="load">查询</el-button><el-button @click="reset">重置</el-button></div></div></div>
    <div class="page-table"><el-table v-loading="L" :data="T" stripe border  style="width:100%">
      <el-table-column prop="order_number" label="单号" width="160"/><el-table-column prop="supplier_name" label="供应商" width="120"/>
      <el-table-column prop="total_amount" label="总金额" width="80"/><el-table-column prop="paid_amount" label="已付" width="80"/>
      <el-table-column label="状态" width="80"><template #default="{row}">{{['','进行中','已完成','已取消'][row.status]}}</template></el-table-column>
      <el-table-column label="操作" width="260" fixed="right"><template #default="{row}">
        <el-button link type="primary" @click="openItems(row.id)">明细</el-button>
        <el-button v-if="row.status===1" link type="success" @click="updateStatus(row.id,2)">完成</el-button>
        <el-button v-if="row.status===1" link type="primary" @click="payOrder(row.id)">付款</el-button>
        <el-button v-if="row.status===1" link type="danger" @click="updateStatus(row.id,3)">取消</el-button>
      </template></el-table-column>
    </el-table></div>
    <el-pagination v-model:current-page="P" v-model:page-size="S" :total="t" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="onSizeChange" @current-change="load" class="page-pagination"/>
    <el-dialog v-model="D" title="新增采购单" width="600px">
      <el-form :model="F" label-width="100px">
        <el-form-item label="供应商"><el-select v-model="F.supplierId"><el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id"/></el-select></el-form-item>
        <el-form-item label="日期"><el-input v-model="F.orderDate" placeholder="yyyy-MM-dd"/></el-form-item>
        <el-form-item label="结算方式"><el-radio-group v-model="F.type"><el-radio :value="1">现结</el-radio><el-radio :value="2">赊账</el-radio></el-radio-group></el-form-item>
        <el-form-item label="明细"><el-button size="small" @click="addItem">+ 添加</el-button>
          <div v-for="(item,i) in F.items" :key="i" class="flex gap-2 mt-1"><el-input v-model="item.materialId" placeholder="物料ID" style="width:100px"/><el-input-number v-model="item.quantity" :min="1" style="width:100px"/><el-input v-model="item.unitPrice" placeholder="单价" style="width:100px"/><el-button size="small" type="danger" @click="F.items.splice(i,1)">删除</el-button></div>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="F.remark"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="D=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="itemsVis" title="采购明细"><el-table :data="itemsList" stripe><el-table-column prop="material_name" label="物料"/><el-table-column prop="quantity" label="数量"/><el-table-column prop="unit_price" label="单价"/></el-table></el-dialog>
  </div>
</template>
