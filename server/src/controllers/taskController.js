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
// ========== 新增：SSE 流式推送任务进度 ⭐ 核心 ==========
exports.streamTaskStatus = async (req, res) => {
  const contentId = req.params.contentId;
  const userId = req.user.id;

  // 1. 先校验内容是否属于当前用户
  const [contents] = await pool.query(
    'SELECT id FROM contents WHERE id = ? AND user_id = ?',
    [contentId, userId]
  );
  if (contents.length === 0) {
    return res.status(404).json({ code: 404, message: '内容不存在' });
  }

  // 2. 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',   // SSE 固定类型
    'Cache-Control': 'no-cache',           // 不缓存
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',             // Nginx 关闭缓冲，关键！
  });

  console.log(`📡 SSE 连接建立: contentId=${contentId}, user=${userId}`);

  let completed = false;

  // 3. 每 1 秒查一次任务状态，推送给前端
  const timer = setInterval(async () => {
    try {
      const [tasks] = await pool.query(
        'SELECT * FROM ai_tasks WHERE content_id = ? ORDER BY id DESC LIMIT 1',
        [contentId]
      );

      if (tasks.length === 0) {
        // 没有任务记录，直接结束
        res.write(`data: ${JSON.stringify({ status: 'no_task' })}\n\n`);
        cleanup();
        return;
      }

      const task = tasks[0];

      // 推送给前端（SSE 格式：data: xxx\n\n）
      res.write(`data: ${JSON.stringify(task)}\n\n`);

      // 如果任务完成或失败，停止推送
      if (task.status === 'completed' || task.status === 'failed') {
        completed = true;
        cleanup();
      }
    } catch (err) {
      console.error('SSE 查询错误:', err);
      res.write(`data: ${JSON.stringify({ status: 'error', message: err.message })}\n\n`);
      cleanup();
    }
  }, 1000);  // 1 秒一次

  // 4. 清理函数：关闭定时器，结束响应
  function cleanup() {
    if (completed) return;
    completed = true;
    clearInterval(timer);
    res.end();
    console.log(`🔌 SSE 连接关闭: contentId=${contentId}`);
  }

  // 5. 前端断开连接时，清理定时器
  req.on('close', () => {
    console.log(`🔌 前端断开 SSE: contentId=${contentId}`);
    cleanup();
  });
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