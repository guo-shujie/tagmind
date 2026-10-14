const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/mysql');
const config = require('../config');

// 注册
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 简单参数校验
    if (!username || !email || !password) {
      return res.status(400).json({ code: 400, message: '用户名、邮箱、密码不能为空' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码至少 6 位' });
    }

    // 检查用户名是否已存在
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ code: 409, message: '用户名或邮箱已被注册' });
    }

    // 密码加密（bcrypt 自动加盐）
    const passwordHash = await bcrypt.hash(password, 10);

    // 插入数据库
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    // 生成 token
    const token = jwt.sign(
      { userId: result.insertId, username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      code: 0,
      message: '注册成功',
      data: {
        token,
        user: { id: result.insertId, username, email },
      },
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    // 查用户
    const [users] = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = ?',
      [username]
    );
    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const user = users[0];

    // 校验密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 生成 token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email },
      },
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 获取当前用户信息（需要登录）
exports.me = async (req, res) => {
  res.json({
    code: 0,
    data: { user: req.user },
  });
};