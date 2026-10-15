const { pool } = require('../db/mysql');

// 获取内容的 AI 分析任务状态
exports.getTaskStatus = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const userId = req.user.id;

    // 先确认内容属于当前用户
    const [contents] = await pool.query(
      'SELECT id FROM contents WHERE id = ? AND user_id = ?',
      [contentId, userId]
    );
    if (contents.length === 0) {
      return res.status(404).json({ code: 404, message: '内容不存在' });
    }

    // 查最新的一条任务
    const [tasks] = await pool.query(
      'SELECT * FROM ai_tasks WHERE content_id = ? ORDER BY id DESC LIMIT 1',
      [contentId]
    );

    if (tasks.length === 0) {
      return res.json({ code: 0, data: null });
    }

    res.json({ code: 0, data: tasks[0] });
  } catch (err) {
    console.error('获取任务状态错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 手动重试失败的任务
exports.retryTask = async (req, res) => {
  try {
    const contentId = req.params.contentId;
    const userId = req.user.id;

    // 确认内容属于当前用户
    const [contents] = await pool.query(
      'SELECT id FROM contents WHERE id = ? AND user_id = ?',
      [contentId, userId]
    );
    if (contents.length === 0) {
      return res.status(404).json({ code: 404, message: '内容不存在' });
    }

    // 更新任务状态为 pending
    await pool.query(
      `UPDATE ai_tasks SET status = 'pending', progress = 0, error_message = NULL, retries = retries + 1
       WHERE content_id = ? ORDER BY id DESC LIMIT 1`,
      [contentId]
    );

    // 重新入队
    const { addAiAnalysisJob } = require('../queues/aiAnalysisQueue');
    await addAiAnalysisJob(contentId);

    res.json({ code: 0, message: '已重新提交分析任务' });
  } catch (err) {
    console.error('重试任务错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};