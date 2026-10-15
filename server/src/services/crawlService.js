const axios = require('axios');
const cheerio = require('cheerio');

// 从 URL 抓取标题和正文
async function crawlUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // 移除不需要的标签
    $('script, style, nav, footer, header, aside, .ad, .comment').remove();

    // 提取标题
    const title = $('title').text().trim() || $('h1').first().text().trim() || '未命名';

    // 提取正文（找最大的文本块）
    let content = '';
    // 常见的正文选择器，逐个试
    const selectors = ['article', '.article-content', '.post-content', '.content', 'main'];
    for (const selector of selectors) {
      const el = $(selector);
      if (el.length > 0) {
        content = el.text().trim();
        if (content.length > 200) break;
      }
    }

    // 兜底：取 body 的所有文本
    if (content.length < 100) {
      content = $('body').text().trim();
    }

    // 清理多余空白
    content = content.replace(/\s+/g, ' ').trim();

    return { title, content: content.substring(0, 5000) };  // 最多取 5000 字
  } catch (err) {
    console.error('抓取 URL 失败:', err.message);
    throw new Error('网页抓取失败，请检查链接是否有效');
  }
}

module.exports = { crawlUrl };