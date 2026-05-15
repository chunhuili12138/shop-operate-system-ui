<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { http } from "@/utils/http";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import {
  getExpenseList,
  getExpenseCategories,
  addExpense,
  updateExpense,
  deleteExpense
} from "@/api/finance";
defineOptions({name:"FinanceExpense"}); const T=ref([]),L=ref(false),P=ref(1),S=ref(20),t=ref(0);
const D=ref(false),E=ref(false),cats=ref([]),F=reactive({expenseId:null,categoryId:"",amount:"",paymentMethod:"",expenseDate:"",remark:""});
const load=async()=>{L.value=true;try{const r=await getExpenseList({page:P.value,size:S.value});r?.success&&(T.value=r.data.list,t.value=r.data.total)}finally{L.value=false}};
const reset=()=>{P.value=1;load()};
const onSizeChange=(s:number)=>{S.value=s;P.value=1;load()};
const loadCats=async()=>{const r=await getExpenseCategories();r?.success&&(cats.value = r.data||[])};
const save=async()=>{const r=E.value?await updateExpense(F):await addExpense(F);r?.success?(message("成功",{type:"success"}),D.value=false,load()):message(r?.msg||"失败",{type:"warning"})};
onMounted(()=>{load();loadCats()});
</script>
<template>
  <div class="page-container">
    <div class="page-header"><div class="page-header-actions"><div><el-button type="success" @click="D=true;E=false;Object.assign(F,{expenseId:null,categoryId:'',amount:'',paymentMethod:'',expenseDate:'',remark:''})">新增支出</el-button></div><div><el-button type="primary" @click="load">查询</el-button><el-button @click="reset">重置</el-button></div></div></div>
    <div class="page-table"><el-table v-loading="L" :data="T" stripe border  style="width:100%">
      <el-table-column prop="category_name" label="分类"/><el-table-column prop="amount" label="金额"/><el-table-column prop="payment_method" label="支付方式"/>
      <el-table-column prop="expense_date" label="日期"/><el-table-column prop="remark" label="备注"/>
      <el-table-column label="操作" width="150" fixed="right"><template #default="{row}">
        <el-button link type="primary" @click="D=true;E=true;Object.assign(F,{expenseId:row.id,categoryId:row.category_id,amount:row.amount,paymentMethod:row.payment_method,expenseDate:String(row.expense_date),remark:row.remark})">编辑</el-button>
        <el-button link type="danger" @click="async()=>{await ElMessageBox.confirm('确认删除？','提示');const r=await deleteExpense(row.id);r?.success?(message('已删除',{type:'success'}),load()):message(r?.msg||'失败',{type:'warning'})}">删除</el-button>
      </template></el-table-column>
    </el-table></div>
    <el-pagination v-model:current-page="P" v-model:page-size="S" :total="t" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="onSizeChange" @current-change="load" class="page-pagination"/>
    <el-dialog v-model="D" :title="E?'编辑支出':'新增支出'" width="500px"><el-form :model="F" label-width="100px">
      <el-form-item label="分类"><el-select v-model="F.categoryId"><el-option v-for="c in cats" :key="c.id" :label="c.name" :value="c.id"/></el-select></el-form-item>
      <el-form-item label="金额"><el-input v-model="F.amount"/></el-form-item><el-form-item label="支付方式"><el-input v-model="F.paymentMethod"/></el-form-item>
      <el-form-item label="日期"><el-input v-model="F.expenseDate" placeholder="yyyy-MM-dd"/></el-form-item><el-form-item label="备注"><el-input v-model="F.remark"/></el-form-item>
    </el-form><template #footer><el-button @click="D=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template></el-dialog>
  </div>
</template>
