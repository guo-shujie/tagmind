require('dotenv').config();
const { Worker } = require('bullmq');
const config = require('./src/config');
const { pool } = require('./src/db/mysql');
const aiService = require('./src/services/aiService');

// 创建 Worker，监听 ai-analysis 队列
const worker = new Worker(
  'ai-analysis',
  async (job) => {
    const { contentId } = job.data;
    console.log(`📝 开始处理任务: contentId=${contentId}`);

    try {
      // ========== Step 1: 更新任务状态为 processing ==========
      await updateTaskProgress(contentId, 'processing', 0);
      await updateContentStatus(contentId, 'analyzing');

      // ========== Step 2: 生成摘要（进度 25%）==========
      const content = await getContent(contentId);
      const summary = await aiService.generateSummary(content.title, content.content_text);
      await updateTaskProgress(contentId, 'processing', 25, { summary });

      // ========== Step 3: 提取标签（进度 50%）==========
      const tagNames = await aiService.extractTags(content.title, content.content_text);
      await updateTaskProgress(contentId, 'processing', 50, { tags: tagNames });

      // ========== Step 4: 情感分析（进度 75%）==========
      const sentiment = await aiService.analyzeSentiment(content.title, content.content_text);
      await updateTaskProgress(contentId, 'processing', 75, { sentiment });

      // ========== Step 5: 保存结果到数据库（进度 100%）==========
      await saveAnalysisResult(contentId, content.user_id, summary, tagNames, sentiment);

      // 更新任务为完成
      await updateTaskProgress(contentId, 'completed', 100, { summary, tags: tagNames, sentiment });
      await updateContentStatus(contentId, 'published');

      console.log(`✅ 任务完成: contentId=${contentId}`);
      return { success: true, contentId };
    } catch (err) {
      console.error(`❌ 任务失败: contentId=${contentId}, error:`, err.message);
      await updateTaskError(contentId, err.message);
      await updateContentStatus(contentId, 'draft');
      throw err;  // 抛出错误让 BullMQ 知道失败了，会自动重试
    }
  },
  {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
    concurrency: 3,  // 同时处理 3 个任务
  }
);

// ========== 辅助函数 ==========

// 获取内容
async function getContent(contentId) {
  const [rows] = await pool.query(
    'SELECT id, user_id, title, content_text FROM contents WHERE id = ?',
    [contentId]
  );
  if (rows.length === 0) throw new Error('内容不存在');
  return rows[0];
}

// 更新任务进度
async function updateTaskProgress(contentId, status, progress, result = null) {
  await pool.query(
    `UPDATE ai_tasks SET status = ?, progress = ?, result = COALESCE(?, result) 
     WHERE content_id = ? ORDER BY id DESC LIMIT 1`,
    [status, progress, result ? JSON.stringify(result) : null, contentId]
  );
}

// 更新任务错误信息
async function updateTaskError(contentId, errorMessage) {
  await pool.query(
    `UPDATE ai_tasks SET status = 'failed', error_message = ? 
     WHERE content_id = ? ORDER BY id DESC LIMIT 1`,
    [errorMessage, contentId]
  );
}

// 更新内容状态
async function updateContentStatus(contentId, status) {
  await pool.query('UPDATE contents SET status = ? WHERE id = ?', [status, contentId]);
}

// 保存分析结果：写摘要、情感、创建标签、关联标签
async function saveAnalysisResult(contentId, userId, summary, tagNames, sentiment) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. 更新内容的摘要和情感
    await conn.query(
      'UPDATE contents SET summary = ?, sentiment = ? WHERE id = ?',
      [summary, sentiment, contentId]
    );

    // 2. 处理每个标签：存在就关联，不存在就新建
    for (const tagName of tagNames) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-');

      // 先查这个用户有没有这个标签
      const [existing] = await conn.query(
        'SELECT id FROM tags WHERE user_id = ? AND slug = ?',
        [userId, slug]
      );

      let tagId;
      if (existing.length > 0) {
        tagId = existing[0].id;
      } else {
        // 新建标签
        const [result] = await conn.query(
          'INSERT INTO tags (user_id, name, slug) VALUES (?, ?, ?)',
          [userId, tagName, slug]
        );
        tagId = result.insertId;
      }

      // 关联内容和标签
      await conn.query(
        'INSERT IGNORE INTO contents_tags (content_id, tag_id, confidence) VALUES (?, ?, ?)',
        [contentId, tagId, 0.95]  // AI 打的标签置信度 0.95
      );

      // 更新标签使用次数
      await conn.query(
        'UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?',
        [tagId]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Worker 事件监听
worker.on('completed', (job) => {
  console.log(`🎉 Worker 完成任务: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.log(`💥 Worker 任务失败: ${job.id}, 错误: ${err.message}`);
});

console.log('🔄 Worker 进程已启动，等待任务...');

// 优雅退出
process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});