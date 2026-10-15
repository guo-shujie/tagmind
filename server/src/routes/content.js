const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const authMiddleware = require('../middleware/auth');

// 所有内容接口都需要登录
router.use(authMiddleware);

router.post('/', contentController.create);
router.get('/', contentController.list);
router.get('/:id', contentController.detail);
router.put('/:id', contentController.update);
router.delete('/:id', contentController.remove);
router.get('/:id/related', contentController.related);

module.exports = router;