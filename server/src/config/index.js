require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tagmind',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

/**
 * secret: 
 * ◦ 作用: 用于签名和验证 JSON Web Token (JWT) 的密钥。 
 * ◦ 来源: 从环境变量 process.env.JWT_SECRET 中读取。如果环境变量未设置，则使用默认值 'default_secret'。
 * ◦ 重要性: ■ 这是 JWT 的核心安全机制，确保生成的令牌无法被伪造。 ■ 建议: 在生产环境中，务必设置一个强随机的密钥，避免使用默认值。     
 * expiresIn: 
 * ◦ 作用: 指定 JWT 的有效期。 
 * ◦ 来源: 从环境变量 process.env.JWT_EXPIRES_IN 中读取。如果环境变量未设置，则使用默认值 '7d'（7天）。 
 * ◦ 格式: ■ 可以是字符串（如 '7d' 表示 7 天，'24h' 表示 24 小时）。 ■ 也可以是数字（以秒为单位）。   
 * ◦ 重要性: ■ 控制令牌的生命周期，过期后需要重新生成。
 *  ■ 建议: 根据业务需求设置合理的过期时间，避免令牌长期有效带来的安全风险。
 */