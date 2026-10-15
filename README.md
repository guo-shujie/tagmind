# TagMind

> AI 驱动的智能标签内容知识管理平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org/)
[![MySQL Version](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)

## ✨ 项目特点

- 🤖 **AI 自动分析**：自动提取内容摘要、语义标签、情感倾向
- 🏷️ **多对多标签系统**：标签层级树 + 多标签组合筛选 + MySQL 全文检索
- ⚡ **异步任务队列**：BullMQ + Redis，API 与 Worker 进程分离，失败自动重试
- 📡 **SSE 实时推送**：AI 分析进度可视化，实时更新到前端
- 🕸️ **知识图谱**：标签-内容关系可视化，ECharts 力导向图
- 🐳 **Docker 一键部署**：MySQL + Redis + API + Worker + Nginx 全容器化

## 🛠️ 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + Element Plus + Pinia + ECharts |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8.0 + Redis 7 |
| 队列 | BullMQ |
| AI | OpenAI 兼容接口（智谱 GLM / DeepSeek / 通义千问） |
| 部署 | Docker + Docker Compose + Nginx |

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose

### 启动步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/tagmind.git
cd tagmind

# 2. 复制环境变量配置
cp .env.example .env

# 3. 编辑 .env，填入你的 AI API Key
# 推荐用智谱 GLM-4-Flash（永久免费）：https://open.bigmodel.cn

# 4. 一键启动所有服务
docker-compose up -d --build

# 5. 访问应用
# 前端: http://localhost
# API:  http://localhost:3000
```

首次启动会自动建表，注册账号即可使用。

### 查看日志

```bash
# 查看所有服务状态
docker-compose ps

# 查看 API 日志
docker-compose logs -f api

# 查看 Worker 日志
docker-compose logs -f worker

# 查看 MySQL 日志
docker-compose logs -f mysql
```

## 📁 项目结构

```
tagmind/
├── server/              # 后端 API + Worker
│   ├── src/
│   │   ├── routes/          # 路由定义
│   │   ├── controllers/     # 控制器
│   │   ├── services/       # 业务服务（AI 调用、URL 抓取）
│   │   ├── queues/         # BullMQ 队列定义
│   │   ├── workers/        # Worker 处理逻辑
│   │   ├── middleware/     # 中间件（JWT 认证）
│   │   ├── models/         # 数据模型
│   │   └── config/         # 配置
│   ├── worker.js           # Worker 进程入口
│   └── package.json
├── web/                 # 前端 Vue 3
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── components/     # 通用组件
│   │   ├── api/            # API 封装
│   │   ├── stores/        # Pinia 状态管理
│   │   └── router/         # 路由
│   └── package.json
├── init.sql             # 数据库初始化脚本（自动执行）
├── docker-compose.yml    # Docker 编排配置
├── nginx.conf           # Nginx 反向代理配置
├── .env.example         # 环境变量模板
└── README.md
```

## 🗺️ 路线图

- [x] 基础内容管理 + 多对多标签系统
- [x] AI 自动分析（摘要 / 标签提取 / 情感分析）
- [x] 异步任务队列 + SSE 实时进度推送
- [x] 知识图谱可视化
- [ ] 向量语义搜索
- [ ] 多用户协作权限
- [ ] Markdown 编辑器
- [ ] PWA 离线支持
- [ ] 单元测试 + CI/CD

## 🤝 贡献指南

欢迎贡献代码！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 License

[MIT](LICENSE)
