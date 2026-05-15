<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getArticleList,
  getArticleCategories,
  addArticle,
  updateArticle,
  publishArticle,
  deleteArticle
} from "@/api/marketing";
defineOptions({name:"MktArticle"}); const T=ref([]),L=ref(false),P=ref(1),S=ref(20),t=ref(0),Q=reactive({keyword:"",isPublished:""as any});
const D=ref(false),E=ref(false),F=reactive({articleId:null,categoryId:"",title:"",content:"",coverImage:"",contentType:3});
const cats=ref([]);
const load=async()=>{L.value=true;try{const r=await getArticleList({page:P.value,size:S.value,...Q});r?.success&&(T.value=r.data.list,t.value=r.data.total)}finally{L.value=false}};
const reset=()=>{Q.keyword="";Q.isPublished="";P.value=1;load()};
const onSizeChange=(s:number)=>{S.value=s;P.value=1;load()};
const loadCats=async()=>{const r=await getArticleCategories();r?.success&&(cats.value = r.data||[])};
const save=async()=>{const r=E.value?await updateArticle(F):await addArticle(F);r?.success?(message("成功",{type:"success"}),D.value=false,load()):message(r?.msg||"失败",{type:"warning"})};
const toggle=(id:number,pub:number)=>{publishArticle({articleId:id,isPublished:pub?0:1}).then((r)=>{r?.success?(message("已操作",{type:"success"}),load()):message(r?.msg||"失败",{type:"warning"})})};
const doDelete=async(id:number)=>{await import("element-plus").then(m=>m.ElMessageBox.confirm("确认删除？","提示"));const r=await deleteArticle(id);r?.success?(message("已删除",{type:"success"}),load()):message(r?.msg||"失败",{type:"warning"})};
onMounted(()=>{load();loadCats()});
</script>
<template>
  <div class="page-container">
    <div class="page-header"><el-form :model="Q" inline class="page-search">
      <el-form-item label="关键词"><el-input v-model="Q.keyword" clearable @keyup.enter="load"/></el-form-item>
    </el-form>
    <div class="page-header-actions"><div><el-button type="success" @click="D=true;E=false;Object.assign(F,{articleId:null,categoryId:'',title:'',content:'',coverImage:'',contentType:3})">新增文章</el-button></div><div><el-button type="primary" @click="load">查询</el-button><el-button @click="reset">重置</el-button></div></div></div>
    <div class="page-table"><el-table v-loading="L" :data="T" stripe border  style="width:100%">
      <el-table-column prop="title" label="标题" show-overflow-tooltip/><el-table-column label="发布" width="60"><template #default="{row}"><el-tag :type="row.is_published?'success':'info'">{{row.is_published?'已发布':'下架'}}</el-tag></template></el-table-column>
      <el-table-column prop="created_at" label="时间" width="170"/>
      <el-table-column label="操作" width="220" fixed="right"><template #default="{row}">
        <el-button link type="primary" @click="D=true;E=true;Object.assign(F,{articleId:row.id,categoryId:row.category_id,title:row.title,content:row.content,coverImage:row.cover_image,contentType:row.content_type})">编辑</el-button>
        <el-button link :type="row.is_published?'warning':'success'" @click="toggle(row.id,row.is_published)">{{row.is_published?'下架':'发布'}}</el-button>
        <el-button link type="danger" @click="doDelete(row.id)">删除</el-button>
      </template></el-table-column>
    </el-table></div>
    <el-pagination v-model:current-page="P" v-model:page-size="S" :total="t" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="onSizeChange" @current-change="load" class="page-pagination"/>
    <el-dialog v-model="D" :title="E?'编辑文章':'新增文章'" width="600px"><el-form :model="F" label-width="80px">
      <el-form-item label="标题"><el-input v-model="F.title"/></el-form-item>
      <el-form-item label="分类"><el-select v-model="F.categoryId"><el-option v-for="c in cats" :key="c.id" :label="c.name" :value="c.id"/></el-select></el-form-item>
      <el-form-item label="封面"><el-input v-model="F.coverImage" placeholder="图片路径"/></el-form-item>
      <el-form-item label="内容"><el-input v-model="F.content" type="textarea" :rows="6"/></el-form-item>
    </el-form><template #footer><el-button @click="D=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template></el-dialog>
  </div>
</template>
