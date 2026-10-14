/**
 * 在 index.js 中引入 路由模块。使用 express.Router() 将所有路由模块组合在一起。导出组合后的路由。
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

router.use('/auth', authRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ code: 0, message: 'ok', timestamp: new Date() });
});

module.exports = router;