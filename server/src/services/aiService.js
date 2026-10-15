const axios = require('axios');
const config = require('../config');

// 通用调用 AI 的方法
async function callAI(systemPrompt, userPrompt) {
  if (!config.ai.apiKey) {
    // 没有 API key 时返回 mock 数据，方便先调试代码
    console.log('⚠️ 未配置 AI_API_KEY，返回 mock 数据');
    return mockAIResponse(userPrompt);
  }

  const response = await axios.post(
    `${config.ai.apiBase}/chat/completions`,
    {
      model: config.ai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,  // 低温度，输出更稳定
    },
    {
      headers: {
        'Authorization': `Bearer ${config.ai.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data.choices[0].message.content;
}

// 1. 生成内容摘要
async function generateSummary(title, content) {
  const systemPrompt = '你是一个专业的内容摘要助手。请用中文生成 150-200 字的内容摘要，提炼核心观点。只输出摘要内容，不要前缀。';
  const userPrompt = `标题：${title}\n内容：${content.substring(0, 3000)}\n\n请生成摘要：`;

  const result = await callAI(systemPrompt, userPrompt);
  return result.trim();
}

// 2. 提取语义标签
async function extractTags(title, content) {
  const systemPrompt = `你是一个内容标签提取专家。请从给定内容中提取 5-8 个最核心的标签关键词。
要求：
1. 只输出标签，用英文逗号分隔
2. 标签要简洁，每个标签 2-6 个字
3. 不要输出编号或解释
示例输出：前端,Vue,性能优化,虚拟DOM`;

  const userPrompt = `标题：${title}\n内容：${content.substring(0, 3000)}\n\n请提取标签：`;

  const result = await callAI(systemPrompt, userPrompt);
  // 解析成数组："前端, Vue, 性能优化" → ["前端", "Vue", "性能优化"]
  return result.split(',').map(t => t.trim()).filter(t => t.length > 0);
}

// 3. 情感分析
async function analyzeSentiment(title, content) {
  const systemPrompt = '你是一个情感分析专家。请判断内容的情感倾向，只输出以下三个词之一：positive, neutral, negative';
  const userPrompt = `标题：${title}\n内容：${content.substring(0, 2000)}\n\n情感倾向：`;

  const result = await callAI(systemPrompt, userPrompt).trim().toLowerCase();

  // 校验返回值是否合法
  if (['positive', 'neutral', 'negative'].includes(result)) {
    return result;
  }
  return 'neutral';
}

// Mock 数据（没配 API key 时用）
function mockAIResponse(prompt) {
  // 根据不同的 prompt 返回不同的 mock
  if (prompt.includes('摘要')) {
    return '这是一条由 AI 生成的示例摘要，用于演示 TagMind 的自动分析功能。内容涵盖了核心观点和主要结论，帮助用户快速了解文章大意。';
  }
  if (prompt.includes('标签')) {
    return '技术,前端,教程,最佳实践,效率工具';
  }
  if (prompt.includes('情感')) {
    return 'neutral';
  }
  return 'mock result';
}

module.exports = {
  generateSummary,
  extractTags,
  analyzeSentiment,
};