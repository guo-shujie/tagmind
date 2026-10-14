/**
 * 在 index.js 中引入 路由模块。使用 express.Router() 将所有路由模块组合在一起。导出组合后的路由。
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const contentRoutes = require('./content');   // 新增
const tagRoutes = require('./tag');           // 新增

router.use('/auth', authRoutes);
router.use('/contents', contentRoutes);        // 新增
router.use('/tags', tagRoutes);                // 新增

// 健康检查
router.get('/health', (req, res) => {
  res.json({ code: 0, message: 'ok', timestamp: new Date() });
});

module.exports = router;