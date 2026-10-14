const express = require('express');
const cors = require('cors');
const config = require('./config');
const { testConnection } = require('./db/mysql');
const routes = require('./routes');

const app = express();

// 中间件
app.use(cors());                    // 跨域
app.use(express.json());            // 解析 JSON body
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api', routes);

// 启动
async function start() {
  await testConnection();           // 先测数据库连接
  app.listen(config.port, '127.0.0.1', () => {
    console.log(`🚀 服务器启动: http://localhost:${config.port}`);
  });
}

start();