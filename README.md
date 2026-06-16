# 地方民俗节日日历

浏览各地传统节日，支持按地区筛选、查看详情，以及基础的增删改查（MVP）。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Element Plus + Pinia + axios（端口 **8101**） |
| 后端 | Express + SQLite（`./data/festival.db`，端口 **8000**） |

## 目录结构

```
├── backend/          # Express API
├── frontend/         # Vue 3 前端
└── README.md
```

## 启动方式

依赖均在各自目录内通过 `npm install` 安装，无需全局 pnpm/yarn。

### 1. 后端（一条命令）

```bash
cd backend && npm install && npm start
```

服务地址：`http://localhost:8000`  
API 前缀：`/api/festivals`

首次启动会自动创建 SQLite 数据库并写入 5 条示例节日数据。

### 2. 前端

另开终端：

```bash
cd frontend && npm install && npm run dev
```

访问：`http://localhost:8101`

## 功能说明（MVP）

- **节日列表**：`el-table` 展示名称、地区、日期说明、习俗摘要、来源
- **地区筛选**：下拉选择地区，支持查看全部
- **详情**：点击行或「详情」按钮查看完整信息
- **CRUD**：新增、编辑、删除节日

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/festivals` | 列表，可选 `?region=云南` |
| GET | `/api/festivals/regions` | 地区列表 |
| GET | `/api/festivals/:id` | 详情 |
| POST | `/api/festivals` | 新增 |
| PUT | `/api/festivals/:id` | 更新 |
| DELETE | `/api/festivals/:id` | 删除 |

## 数据字段

| 字段 | 说明 |
|------|------|
| name | 名称 |
| region | 地区 |
| date_description | 日期说明 |
| custom_summary | 习俗摘要 |
| source | 来源 |

## 范围说明

本项目为 MVP 演示，**不包含**：登录/JWT、Redis、Docker、MySQL/PostgreSQL 等。
