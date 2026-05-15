<script setup lang="ts">
import { ref, onMounted, reactive } from "vue"; import { http } from "@/utils/http"; import { message } from "@/utils/message";
defineOptions({name:"InvMaterial"}); const T=ref([]),L=ref(false),P=ref(1),S=ref(20),t=ref(0),Q=reactive({keyword:"",type:""as any});
const D=ref(false),E=ref(false),F=reactive({materialId:null,name:"",sku:"",category:"",unit:"个",type:1,minStock:null,remark:""});
const load=async()=>{L.value=true;try{const r:any=await http.get("/materials",{params:{page:P.value,size:S.value,...Q}});r?.success&&(T.value=r.data.list,t.value=r.data.total)}finally{L.value=false}};
const reset=()=>{Q.keyword="";Q.type="";P.value=1;load()};
const onSizeChange=(s:number)=>{S.value=s;P.value=1;load()};
const openAdd=()=>{E.value=false;Object.assign(F,{materialId:null,name:"",sku:"",category:"",unit:"个",type:1,minStock:null,remark:""});D.value=true};
const openEdit=(r:any)=>{E.value=true;Object.assign(F,{materialId:r.id,name:r.name,sku:r.sku,category:r.category,unit:r.unit,type:r.type,minStock:r.min_stock,remark:r.remark});D.value=true};
const save=async()=>{const url=E.value?"/materialsUpdate":"/materialsAdd";const r:any=await http.request(E.value?"put":"post",url,{data:F});r?.success?(message("成功",{type:"success"}),D.value=false,load()):message(r?.msg||"失败",{type:"warning"})};
const del=async(id:number)=>{await import("element-plus").then(m=>m.ElMessageBox.confirm("确认删除？","提示"));const r:any=await http.delete("/materialsDelete",{params:{materialId:id}});r?.success?(message("已删除",{type:"success"}),load()):message(r?.msg||"失败",{type:"warning"})};
onMounted(load);
</script>
<template>
  <div class="page-container">
    <div class="page-header"><el-form :model="Q" inline class="page-search">
      <el-form-item label="关键词"><el-input v-model="Q.keyword" clearable @keyup.enter="load"/></el-form-item>
      <el-form-item label="类型"><el-select v-model="Q.type" clearable style="width:100px"><el-option label="消耗品" :value="1"/><el-option label="工具" :value="2"/></el-select></el-form-item>
    </el-form>
    <div class="page-header-actions"><div><el-button type="success" @click="openAdd">新增物料</el-button></div><div><el-button type="primary" @click="load">查询</el-button><el-button @click="reset">重置</el-button></div></div></div>
    <div class="page-table"><el-table v-loading="L" :data="T" stripe border  style="width:100%">
      <el-table-column prop="name" label="名称"/><el-table-column prop="sku" label="SKU" width="100"/><el-table-column prop="category" label="分类" width="80"/>
      <el-table-column prop="unit" label="单位" width="50"/><el-table-column label="类型" width="70"><template #default="{row}">{{['','消耗品','工具'][row.type]}}</template></el-table-column>
      <el-table-column prop="min_stock" label="最低库存" width="80"/>
      <el-table-column label="操作" width="180" fixed="right"><template #default="{row}">
        <el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-button link type="danger" @click="del(row.id)">删除</el-button>
      </template></el-table-column>
    </el-table></div>
    <el-pagination v-model:current-page="P" v-model:page-size="S" :total="t" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="onSizeChange" @current-change="load" class="page-pagination"/>
    <el-dialog v-model="D" :title="E?'编辑物料':'新增物料'" width="500px">
      <el-form :model="F" label-width="100px">
        <el-form-item label="名称"><el-input v-model="F.name"/></el-form-item><el-form-item label="SKU"><el-input v-model="F.sku"/></el-form-item>
        <el-form-item label="分类"><el-input v-model="F.category"/></el-form-item><el-form-item label="单位"><el-input v-model="F.unit"/></el-form-item>
        <el-form-item label="类型"><el-radio-group v-model="F.type"><el-radio :value="1">消耗品</el-radio><el-radio :value="2">工具</el-radio></el-radio-group></el-form-item>
        <el-form-item label="最低库存"><el-input-number v-model="F.minStock" :min="0"/></el-form-item><el-form-item label="备注"><el-input v-model="F.remark" type="textarea"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="D=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>
