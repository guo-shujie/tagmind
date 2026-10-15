const { Queue } = require('bullmq');
const config = require('../config');

// BullMQ 需要一个独立的 Redis 连接
const connection = {
  host: config.redis.host,
  port: config.redis.port,
};
// **设计要点**：
// - `jobId` 用 `content-${contentId}` → 同一条内容不会重复入队
// - `attempts: 3` → AI 调用失败自动重试 3 次
// - `removeOnComplete` → 队列自动清理，不占内存

// ---
// 创建 AI 分析队列
const aiAnalysisQueue = new Queue('ai-analysis', {
  connection,
  defaultJobOptions: {
    attempts: 3,                    // 失败自动重试 3 次
    backoff: {
      type: 'exponential',         // 指数退避
      delay: 2000,                 // 第一次等 2 秒，第二次 4 秒，第三次 8 秒
    },
    removeOnComplete: 100,         // 完成的任务保留 100 条，防止内存爆
    removeOnFail: 50,               // 失败的任务保留 50 条
  },
});

// 添加 AI 分析任务
async function addAiAnalysisJob(contentId) {
  const job = await aiAnalysisQueue.add(
    'full-analysis',
    { contentId },
    {
      jobId: `content-${contentId}`,  // 用 contentId 做 jobId，防止重复提交
    }
  );
  return job;
}

module.exports = { aiAnalysisQueue, addAiAnalysisJob };