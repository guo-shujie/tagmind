const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', tagController.create);
router.get('/', tagController.list);
router.get('/tree', tagController.tree);       // 标签树
router.put('/:id', tagController.update);
router.delete('/:id', tagController.remove);

module.exports = router;