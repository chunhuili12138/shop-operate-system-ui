# 门店运营管理系统前端

![License](https://img.shields.io/github/license/pure-admin/vue-pure-admin.svg)
![Vue Version](https://img.shields.io/badge/Vue-3.5.22-brightgreen)
![Vite Version](https://img.shields.io/badge/Vite-7.1.12-blue)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.11.5-green)

## 📖 介绍

这是一个基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 精简版开发的门店运营管理系统前端项目。该项目提供了完整的门店运营管理解决方案，包括客户管理、财务管理、库存管理、营销管理等功能模块。

## ✨ 特性

- 🚀 **最新技术栈**：使用 Vue3、Vite、TypeScript 等前沿技术开发
- 🎨 **UI 框架**：集成 Element Plus 组件库，提供丰富的组件
- 📱 **响应式设计**：适配多种屏幕尺寸
- 🔐 **权限管理**：内置完善的权限控制系统
- 📊 **数据可视化**：集成 ECharts 图表库
- 🌈 **主题定制**：支持深色模式和主题自定义
- 🛠️ **工程化**：完整的代码规范、提交规范和构建流程
- ☁️ **SaaS 多租户**：支持商户席位订阅管理，包括席位新增、续订、退款等功能

## 🛠️ 技术栈

- **前端框架**：Vue 3.5.22
- **构建工具**：Vite 7.1.12
- **UI 组件库**：Element Plus 2.11.5
- **状态管理**：Pinia 3.0.3
- **路由管理**：Vue Router 4.6.3
- **CSS 预处理器**：Sass + Tailwind CSS 4.1.16
- **HTTP 客户端**：Axios 1.12.2
- **富文本编辑器**：WangEditor 5.x
- **数据可视化**：ECharts 6.0.0
- **工具库**：@vueuse/core, dayjs, lodash 等

## 📦 安装与运行

### 环境要求

- Node.js: ^20.19.0 || >=22.13.0
- pnpm: >=9

### 安装依赖

```bash
pnpm install
```

### 开发模式运行

```bash
pnpm dev
# 或者
pnpm serve
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

### 其他常用命令

```bash
# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 清理缓存
pnpm clean:cache
```

## 📁 项目结构

```
src/
├── api/              # API 接口定义
├── assets/           # 静态资源
├── components/       # 公共组件
├── config/           # 配置文件
├── directives/       # 自定义指令
├── hooks/            # 组合式函数
├── layout/           # 布局组件
├── plugins/          # 插件配置
├── router/           # 路由配置
├── store/            # 状态管理
├── style/            # 全局样式
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
└── views/            # 页面视图
```

## 📋 功能模块

- **仪表盘**：系统概览和关键指标展示
- **客户管理**：客户信息维护和管理
- **财务管理**：财务数据统计和分析
- **库存管理**：商品库存监控和管理
- **营销管理**：营销活动配置和执行
- **系统管理**：用户、角色、权限等基础配置
- **个人中心**：个人信息管理和设置
- **租户管理**：SaaS 多租户管理体系，支持商户席位订阅、流水管理等功能

## 🔧 开发规范

本项目采用以下开发规范：

- **代码风格**：Prettier + ESLint
- **提交规范**：Conventional Commits (通过 Commitlint)
- **Git Hooks**：Husky + Lint-staged
- **分支策略**：建议使用 Git Flow 工作流

## 📄 许可证

[MIT © 2020-present, pure-admin](./LICENSE)
