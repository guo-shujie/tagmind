const Redis = require('ioredis');
const config = require('../config');

// 创建 Redis 连接（BullMQ 要求用 ioredis）
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,  // BullMQ 要求这个设置
});

redis.on('connect', () => {
  console.log('✅ Redis 连接成功');
});

redis.on('error', (err) => {
  console.error('❌ Redis 连接错误:', err.message);
});

module.exports = { redis };