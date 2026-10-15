// 内容 CRUD，重点是列表查询带标签筛选和全文搜索
const { pool } = require('../db/mysql');

// 创建内容
exports.create = async (req, res) => {
    try {
        const { title, content_text, source_url, tag_ids } = req.body;
        const userId = req.user.id;

        if (!title || !content_text) {
            return res.status(400).json({ code: 400, message: '标题和内容不能为空' });
        }

        // 开启事务：插入内容 + 插入标签关联，要么都成功要么都失败
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. 插入内容
            const [result] = await conn.query(
                'INSERT INTO contents (user_id, title, content_text, source_url, status) VALUES (?, ?, ?, ?, ?)',
                [userId, title, content_text, source_url || null, 'draft']
            );
            const contentId = result.insertId;

            // 2. 如果传了标签ID，批量插入关联
            if (tag_ids && tag_ids.length > 0) {
                // 校验标签是否属于当前用户
                const [validTags] = await conn.query(
                    'SELECT id FROM tags WHERE id IN (?) AND user_id = ?',
                    [tag_ids, userId]
                );
                const validTagIds = validTags.map(t => t.id);

                if (validTagIds.length > 0) {
                    // 批量插入：构造 VALUES (?,?), (?,?), ...
                    const values = validTagIds.map(() => '(?, ?)').join(', ');
                    const params = [];
                    validTagIds.forEach(tagId => {
                        params.push(contentId, tagId);
                    });

                    await conn.query(
                        `INSERT INTO contents_tags (content_id, tag_id) VALUES ${values}`,
                        params
                    );

                    // 更新标签的 usage_count（冗余统计字段）
                    await conn.query(
                        `UPDATE tags SET usage_count = usage_count + 1 WHERE id IN (${validTagIds.map(() => '?').join(',')})`,
                        validTagIds
                    );
                }
            }

            await conn.commit();

            // ========== 新增：创建 AI 分析任务 ==========
            await createAiTask(contentId);


            res.json({
                code: 0,
                message: '创建成功，AI 分析已开始',
                data: { id: contentId, title },
            });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('创建内容错误:', err);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
};

// 辅助函数：创建 AI 任务记录 + 入队
async function createAiTask(contentId) {
    const { addAiAnalysisJob } = require('../queues/aiAnalysisQueue');

    // 1. 在 ai_tasks 表插入任务记录
    const [result] = await pool.query(
        `INSERT INTO ai_tasks (task_id, content_id, type, status, progress) 
    VALUES (?, ?, 'full_analysis', 'pending', 0)`,
        [`job-${Date.now()}`, contentId]
    );

    // 2. 把任务加到 BullMQ 队列
    await addAiAnalysisJob(contentId);
}

// 获取内容列表（带标签筛选 + 全文搜索 + 分页）⭐ 核心查询
exports.list = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const tagIds = req.query.tag_ids ? req.query.tag_ids.split(',').map(Number) : [];
        const keyword = req.query.keyword || '';

        // 动态构造 WHERE 条件
        let whereSql = 'WHERE c.user_id = ?';
        const params = [userId];

        // 标签筛选：多标签取交集（内容必须同时包含所有选中的标签）
        if (tagIds.length > 0) {
            // 经典多对多筛选：每个标签都要 JOIN 一次中间表
            // 比如选了标签 [1,2]，就要 JOIN contents_tags 两次
            tagIds.forEach((tagId, index) => {
                whereSql += ` AND EXISTS (
          SELECT 1 FROM contents_tags ct${index} 
          WHERE ct${index}.content_id = c.id AND ct${index}.tag_id = ?
        )`;
                params.push(tagId);
            });
        }

        // 全文搜索：MATCH AGAINST
        if (keyword) {
            whereSql += ' AND MATCH(c.title, c.content_text) AGAINST (? IN NATURAL LANGUAGE MODE)';
            params.push(keyword);
        }

        // 查询总数
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM contents c ${whereSql}`,
            params
        );
        const total = countResult[0].total;

        // 查询列表，带上标签信息
        const [list] = await pool.query(
            `SELECT c.id, c.title, c.summary, c.sentiment, c.status, c.view_count, c.created_at,
              (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'name', t.name, 'color', t.color))
               FROM contents_tags ct
               JOIN tags t ON ct.tag_id = t.id
               WHERE ct.content_id = c.id) AS tags
       FROM contents c
       ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        res.json({
            code: 0,
            data: {
                list,
                total,
                page,
                pageSize,
            },
        });
    } catch (err) {
        console.error('获取内容列表错误:', err);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
};

// 获取单条内容详情
exports.detail = async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = req.params.id;

        // 查内容
        const [contents] = await pool.query(
            'SELECT * FROM contents WHERE id = ? AND user_id = ?',
            [contentId, userId]
        );
        if (contents.length === 0) {
            return res.status(404).json({ code: 404, message: '内容不存在' });
        }

        // 查关联标签
        const [tags] = await pool.query(
            `SELECT t.id, t.name, t.color 
       FROM contents_tags ct
       JOIN tags t ON ct.tag_id = t.id
       WHERE ct.content_id = ?`,
            [contentId]
        );

        // 浏览量 +1
        await pool.query('UPDATE contents SET view_count = view_count + 1 WHERE id = ?', [contentId]);

        res.json({
            code: 0,
            data: { ...contents[0], tags },
        });
    } catch (err) {
        console.error('获取详情错误:', err);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
};

// 更新内容
exports.update = async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = req.params.id;
        const { title, content_text, source_url, tag_ids } = req.body;

        // 先确认内容属于当前用户
        const [existing] = await pool.query(
            'SELECT id FROM contents WHERE id = ? AND user_id = ?',
            [contentId, userId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ code: 404, message: '内容不存在' });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 更新内容基本信息
            await conn.query(
                'UPDATE contents SET title = ?, content_text = ?, source_url = ? WHERE id = ?',
                [title, content_text, source_url || null, contentId]
            );

            // 如果传了 tag_ids，先删旧关联，再插新关联
            if (tag_ids !== undefined) {
                // 查出原来的标签，要把 usage_count 减回去
                const [oldTags] = await conn.query(
                    'SELECT tag_id FROM contents_tags WHERE content_id = ?',
                    [contentId]
                );
                const oldTagIds = oldTags.map(t => t.tag_id);

                // 删除旧关联
                await conn.query('DELETE FROM contents_tags WHERE content_id = ?', [contentId]);

                // 旧标签 usage_count -1
                if (oldTagIds.length > 0) {
                    await conn.query(
                        `UPDATE tags SET usage_count = usage_count - 1 WHERE id IN (${oldTagIds.map(() => '?').join(',')})`,
                        oldTagIds
                    );
                }

                // 插入新关联
                if (tag_ids.length > 0) {
                    const values = tag_ids.map(() => '(?, ?)').join(', ');
                    const params = [];
                    tag_ids.forEach(tagId => {
                        params.push(contentId, tagId);
                    });

                    await conn.query(
                        `INSERT INTO contents_tags (content_id, tag_id) VALUES ${values}`,
                        params
                    );

                    // 新标签 usage_count +1
                    await conn.query(
                        `UPDATE tags SET usage_count = usage_count + 1 WHERE id IN (${tag_ids.map(() => '?').join(',')})`,
                        tag_ids
                    );
                }
            }

            await conn.commit();
            res.json({ code: 0, message: '更新成功' });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('更新内容错误:', err);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
};

// 删除内容
exports.remove = async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = req.params.id;

        // 删除内容，外键 ON DELETE CASCADE 会自动删 contents_tags
        const [result] = await pool.query(
            'DELETE FROM contents WHERE id = ? AND user_id = ?',
            [contentId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 404, message: '内容不存在' });
        }

        res.json({ code: 0, message: '删除成功' });
    } catch (err) {
        console.error('删除内容错误:', err);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
};

// 获取相似内容推荐 ⭐ 核心 SQL
exports.related = async (req, res) => {
    try {
      const userId = req.user.id;
      const contentId = req.params.id;
  
      // 先确认内容属于当前用户
      const [contents] = await pool.query(
        'SELECT id FROM contents WHERE id = ? AND user_id = ?',
        [contentId, userId]
      );
      if (contents.length === 0) {
        return res.status(404).json({ code: 404, message: '内容不存在' });
      }
  
      // SQL：找和当前内容共享标签最多的 5 条内容
      // 思路：
      // 1. 先查出当前内容有哪些标签
      // 2. 找其他内容也带有这些标签的
      // 3. 按共享标签数量排序，取前 5 条
      const [related] = await pool.query(
        `SELECT c.id, c.title, c.summary, c.view_count, COUNT(ct.tag_id) AS shared_tags
         FROM contents c
         JOIN contents_tags ct ON c.id = ct.content_id
         WHERE ct.tag_id IN (
           SELECT tag_id FROM contents_tags WHERE content_id = ?
         )
         AND c.id != ?
         AND c.user_id = ?
         GROUP BY c.id
         ORDER BY shared_tags DESC, c.view_count DESC
         LIMIT 5`,
        [contentId, contentId, userId]
      );
  
      res.json({ code: 0, data: related });
    } catch (err) {
      console.error('获取相似内容错误:', err);
      res.status(500).json({ code: 500, message: '服务器错误' });
    }
  };