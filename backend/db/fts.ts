import { db } from "@/db";

/**
 * 初始化全文搜索 Schema（FTS5 + trigram 分词）
 *
 * 说明：
 * - Drizzle ORM 不支持定义 FTS5 虚拟表，故通过原生 SQL 在此维护
 * - 使用普通 FTS5 表（自带 title/content 副本），而非 external content 模式
 *   原因：实测 external content 与 trigram 分词不兼容，中文 3 字匹配返回 0 行
 * - 通过 AFTER INSERT/UPDATE/DELETE 触发器自动同步 notes 表到 notes_fts
 * - 幂等：所有语句使用 IF NOT EXISTS，可重复执行
 */
export const ensureFtsSchema = async () => {
    // 1. 建 FTS5 虚拟表（trigram 分词器，支持中文按 3 字符滑动窗口匹配）
    await db.run(`
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            title,
            content,
            tokenize = 'trigram'
        );
    `);

    // 2. 插入触发器：notes 新增时同步写入 notes_fts
    await db.run(`
        CREATE TRIGGER IF NOT EXISTS notes_fts_ai AFTER INSERT ON notes BEGIN
            INSERT INTO notes_fts(rowid, title, content)
            VALUES (new.id, new.title, new.content);
        END;
    `);

    // 3. 更新触发器：notes 的 title/content 变更时，先删旧值再插新值
    await db.run(`
        CREATE TRIGGER IF NOT EXISTS notes_fts_au AFTER UPDATE OF title, content ON notes BEGIN
            DELETE FROM notes_fts WHERE rowid = old.id;
            INSERT INTO notes_fts(rowid, title, content)
            VALUES (new.id, new.title, new.content);
        END;
    `);

    // 4. 删除触发器：notes 删除时清理 notes_fts 对应行
    await db.run(`
        CREATE TRIGGER IF NOT EXISTS notes_fts_ad AFTER DELETE ON notes BEGIN
            DELETE FROM notes_fts WHERE rowid = old.id;
        END;
    `);

    // 5. 历史数据回填：将已存在但未进入 FTS 索引的 notes 同步进来
    await db.run(`
        INSERT INTO notes_fts(rowid, title, content)
        SELECT id, title, content FROM notes
        WHERE id NOT IN (SELECT rowid FROM notes_fts);
    `);
};
