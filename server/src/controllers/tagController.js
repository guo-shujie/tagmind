const { pool } = require('../db/mysql');

// 创建标签
exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, parent_id, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ code: 400, message: '标签名不能为空' });
    }

    // 生成 slug（简单处理：直接用拼音/英文，中文就用 name）
    // 实际项目可以用 transliteration 库转拼音
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    // 检查同一用户下是否重名
    const [existing] = await pool.query(
      'SELECT id FROM tags WHERE user_id = ? AND slug = ?',
      [userId, slug]
    );
    if (existing.length > 0) {
      return res.status(409).json({ code: 409, message: '标签已存在' });
    }

    const [result] = await pool.query(
      'INSERT INTO tags (user_id, name, slug, parent_id, color, description) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, slug, parent_id || null, color || '#1890ff', description || null]
    );

    res.json({
      code: 0,
      message: '创建成功',
      data: { id: result.insertId, name, slug },
    });
  } catch (err) {
    console.error('创建标签错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 获取标签列表（平铺，带层级信息）
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;

    const [tags] = await pool.query(
      `SELECT t.*, 
              p.name as parent_name
       FROM tags t
       LEFT JOIN tags p ON t.parent_id = p.id
       WHERE t.user_id = ?
       ORDER BY t.parent_id, t.created_at`,
      [userId]
    );

    res.json({ code: 0, data: tags });
  } catch (err) {
    console.error('获取标签列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 获取标签树（递归 CTE）⭐ 核心查询
exports.tree = async (req, res) => {
  try {
    const userId = req.user.id;

    // MySQL 8.0 递归 CTE：查出整棵标签树
    // 先查所有根标签（parent_id IS NULL），再递归查子标签
    const [rows] = await pool.query(
      `WITH RECURSIVE tag_tree AS (
         -- 锚点部分：所有根标签
         SELECT id, name, slug, parent_id, color, description, usage_count, 1 AS level
         FROM tags
         WHERE user_id = ? AND parent_id IS NULL
         
         UNION ALL
         
         -- 递归部分：查子标签
         SELECT t.id, t.name, t.slug, t.parent_id, t.color, t.description, t.usage_count, tt.level + 1
         FROM tags t
         INNER JOIN tag_tree tt ON t.parent_id = tt.id
       )
       SELECT * FROM tag_tree ORDER BY level, parent_id, id`,
      [userId]
    );

    // 把平铺数据组装成树结构
    const buildTree = (flatList, parentId = null) => {
      return flatList
        .filter(item => (item.parent_id || null) === parentId)
        .map(item => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          color: item.color,
          level: item.level,
          usage_count: item.usage_count,
          children: buildTree(flatList, item.id),
        }));
    };

    const tree = buildTree(rows);

    res.json({ code: 0, data: tree });
  } catch (err) {
    console.error('获取标签树错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 更新标签
exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const tagId = req.params.id;
    const { name, color, description, parent_id } = req.body;

    const [result] = await pool.query(
      'UPDATE tags SET name = ?, color = ?, description = ?, parent_id = ? WHERE id = ? AND user_id = ?',
      [name, color, description, parent_id || null, tagId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '标签不存在' });
    }

    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新标签错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};

// 删除标签
exports.remove = async (req, res) => {
  try {
    const userId = req.user.id;
    const tagId = req.params.id;

    // 注意：删除标签前要处理子标签（把它们的 parent_id 设为 NULL）
    // 先把这个标签的子标签提升为根标签
    await pool.query(
      'UPDATE tags SET parent_id = NULL WHERE parent_id = ? AND user_id = ?',
      [tagId, userId]
    );

    // 删除标签，外键 ON DELETE CASCADE 会自动删 contents_tags 关联
    const [result] = await pool.query(
      'DELETE FROM tags WHERE id = ? AND user_id = ?',
      [tagId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '标签不存在' });
    }

    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除标签错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
};