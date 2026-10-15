const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/:contentId/status', taskController.getTaskStatus);
router.get('/:contentId/stream', taskController.streamTaskStatus); 
router.post('/:contentId/retry', taskController.retryTask);

module.exports = router;