# 用 Node.js 20 基础镜像
FROM node:20-alpine

WORKDIR /app

# 先复制 package.json，利用 Docker 缓存层
COPY package*.json ./
RUN npm install --production

# 再复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 默认启动 API 服务（Worker 用 command 覆盖）
CMD ["node", "src/index.js"]