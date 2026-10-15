# 贡献指南

感谢你有兴趣为 TagMind 贡献代码！在提交 PR 之前，请先阅读以下规则。

## 🚀 开发流程

### 1. Fork 本仓库

点击右上角的 Fork 按钮，把项目复制到你自己的 GitHub 账号下。

### 2. 克隆到本地

```bash
git clone https://github.com/你的用户名/tagmind.git
cd tagmind
```

### 3. 创建特性分支

```bash
git checkout -b feature/你的功能名
```

分支命名规范：
- `feature/xxx` — 新功能
- `fix/xxx` — 修复 bug
- `docs/xxx` — 文档更新
- `refactor/xxx` — 代码重构

### 4. 本地开发

```bash
# 启动数据库和 Redis
docker-compose up -d mysql redis

# 启动后端 API
cd server
npm install
npm run dev

# 另开一个终端，启动 Worker
cd server
npm run dev:worker

# 另开一个终端，启动前端
cd web
npm install
npm run dev
```

### 5. 提交代码

```bash
git add .
git commit -m "feat: 添加了某某功能"
```

提交信息规范：
- `feat: xxx` — 新功能
- `fix: xxx` — 修复 bug
- `docs: xxx` — 文档修改
- `style: xxx` — 代码格式调整
- `refactor: xxx` — 重构
- `test: xxx` — 测试相关

### 6. 推送到你的 Fork

```bash
git push origin feature/你的功能名
```

### 7. 提交 Pull Request

到 GitHub 你的仓库页面，点击 "New Pull Request"，填写描述后提交。

## 📝 代码规范

### 后端（Node.js / Express）

- 使用 ES6+ 语法，优先用 async/await
- 控制器里写业务逻辑，路由只做转发
- 数据库查询用参数化，不要拼接 SQL（防注入）
- 错误处理用 try/catch，统一返回格式 `{ code: 0, message: 'xxx', data: {} }`

### 前端（Vue 3）

- 使用 Composition API + `<script setup>` 语法
- 组件名用大驼峰（PascalCase）
- API 请求统一放在 `src/api/` 目录
- 状态管理用 Pinia

### 数据库

- 表名用小写 + 下划线（snake_case）
- 必须有 `id` 主键、`created_at`、`updated_at` 时间戳
- 外键要建索引
- 新增字段要写在 `init.sql` 里

## 🐛 提交 Issue

发现 bug 或者有新想法？欢迎提交 Issue！

提交 Issue 时请说明：
- 你做了什么操作
- 预期结果是什么
- 实际结果是什么
- 截图 / 错误日志（如果有）

## ❓ 常见问题

### Q: 本地开发连不上数据库？

A: 先确认 MySQL 容器在运行：`docker-compose ps`，看 mysql 状态是不是 running。

### Q: AI 分析任务一直等待中？

A: 确认 Worker 进程启动了，并且和 API 连的是同一个 Redis。

---

再次感谢你的贡献！🎉
