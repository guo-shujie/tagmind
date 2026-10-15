// ⚠️ 注意：SSE 接口也是用 JWT 认证的，但是 EventSource 原生不支持自定义 header。前端需要把 token 放在 URL query 参数里，或者改用 fetch 读流。我们用 URL 传参的方式。

const jwt = require('jsonwebtoken');
const config = require('../config');

function authMiddleware(req, res, next) {
  // 1. 先从 Authorization header 取
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. 如果 header 没有，从 URL query 参数取（给 SSE 用）
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.userId, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'token 无效或已过期' });
  }
}

module.exports = authMiddleware;