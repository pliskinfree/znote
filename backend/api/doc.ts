import { Context } from "hono";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { vSlug } from "@/utils/check";

/**
 * 获取所有公开文档列表
 * LEFT JOIN notebooks 查出原始笔记本的 title/description，方便后台展示
 * 按 id 倒序排列
 */
export const listDocs = async (c: Context) => {
    const rows = await db
        .select({
            id: schema.docs.id,
            notebook_id: schema.docs.notebook_id,
            slug: schema.docs.slug,
            title: schema.docs.title,
            description: schema.docs.description,
            keywords: schema.docs.keywords,
            status: schema.docs.status,
            created_at: schema.docs.created_at,
            updated_at: schema.docs.updated_at,
            notebook_title: schema.notebooks.title,
            notebook_description: schema.notebooks.description,
        })
        .from(schema.docs)
        .leftJoin(schema.notebooks, eq(schema.docs.notebook_id, schema.notebooks.id))
        .orderBy(desc(schema.docs.id))
        .all();

    return c.json({
        code: 200,
        msg: "doc.list.success",
        data: rows,
    });
};

/**
 * 创建公开文档
 * notebook_id：必须是已存在的顶层笔记本（parent_id IS NULL）
 * slug：仅允许 [a-z0-9-]，全局唯一
 */
export const createDoc = async (c: Context) => {
    const payload = await c.req.json();
    const { notebook_id, slug, title, description, keywords, status } = payload || {};

    // 校验 notebook_id
    if (!notebook_id || typeof notebook_id !== "number") {
        return c.json({ code: -1000, msg: "doc.create.notebook_required", data: null });
    }

    // 校验笔记本必须存在且为顶层笔记本
    const notebook = await db
        .select({ id: schema.notebooks.id, parent_id: schema.notebooks.parent_id })
        .from(schema.notebooks)
        .where(eq(schema.notebooks.id, notebook_id))
        .get();

    if (!notebook) {
        return c.json({ code: -1000, msg: "doc.create.notebook_not_found", data: null });
    }
    if (notebook.parent_id !== null) {
        return c.json({ code: -1000, msg: "doc.create.notebook_not_top_level", data: null });
    }

    // 校验笔记本未被其他文档引用
    const existingDocByNotebook = await db
        .select({ id: schema.docs.id })
        .from(schema.docs)
        .where(eq(schema.docs.notebook_id, notebook_id))
        .get();

    if (existingDocByNotebook) {
        return c.json({ code: -1000, msg: "doc.create.notebook_already_published", data: null });
    }

    // 校验 slug
    if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
        return c.json({ code: -1000, msg: "doc.create.slug_required", data: null });
    }
    const trimmedSlug = slug.trim().toLowerCase();
    if (!vSlug(trimmedSlug)) {
        return c.json({ code: -1000, msg: "doc.create.slug_invalid", data: null });
    }

    // 校验 slug 全局唯一
    const existingDocBySlug = await db
        .select({ id: schema.docs.id })
        .from(schema.docs)
        .where(eq(schema.docs.slug, trimmedSlug))
        .get();

    if (existingDocBySlug) {
        return c.json({ code: -1000, msg: "doc.create.slug_exists", data: null });
    }

    // 校验 status（若传入）
    if (status !== undefined && status !== "active" && status !== "inactive") {
        return c.json({ code: -1000, msg: "doc.create.status_invalid", data: null });
    }

    // 插入文档配置
    const now = new Date();
    const result = await db
        .insert(schema.docs)
        .values({
            notebook_id,
            slug: trimmedSlug,
            title: title ?? "",
            description: description ?? "",
            keywords: keywords ?? "",
            status: status ?? "active",
            created_at: now,
            updated_at: now,
        })
        .returning()
        .get();

    return c.json({
        code: 200,
        msg: "doc.create.success",
        data: result,
    });
};

/**
 * 更新公开文档（部分字段更新）
 * 仅更新传入的字段，slug 和 notebook_id 的查重均排除自身
 */
export const updateDoc = async (c: Context) => {
    const payload = await c.req.json();
    const { id, notebook_id, slug, title, description, keywords, status } = payload || {};

    // 校验 id
    if (!id || typeof id !== "number") {
        return c.json({ code: -1000, msg: "doc.update.id_required", data: null });
    }

    // 查询现有文档记录
    const existingDoc = await db
        .select()
        .from(schema.docs)
        .where(eq(schema.docs.id, id))
        .get();

    if (!existingDoc) {
        return c.json({ code: -1000, msg: "doc.update.not_found", data: null });
    }

    // 校验 notebook_id（若传入）
    if (notebook_id !== undefined) {
        const notebook = await db
            .select({ id: schema.notebooks.id, parent_id: schema.notebooks.parent_id })
            .from(schema.notebooks)
            .where(eq(schema.notebooks.id, notebook_id))
            .get();

        if (!notebook) {
            return c.json({ code: -1000, msg: "doc.update.notebook_not_found", data: null });
        }
        if (notebook.parent_id !== null) {
            return c.json({ code: -1000, msg: "doc.update.notebook_not_top_level", data: null });
        }

        // 查重：新 notebook_id 不能已被其他文档占用（排除自身）
        const conflict = await db
            .select({ id: schema.docs.id })
            .from(schema.docs)
            .where(and(
                eq(schema.docs.notebook_id, notebook_id),
                ne(schema.docs.id, id),
            ))
            .get();

        if (conflict) {
            return c.json({ code: -1000, msg: "doc.update.notebook_already_published", data: null });
        }
    }

    // 校验 slug（若传入）
    let trimmedSlug: string | undefined;
    if (slug !== undefined) {
        if (typeof slug !== "string" || slug.trim().length === 0) {
            return c.json({ code: -1000, msg: "doc.update.slug_required", data: null });
        }
        trimmedSlug = slug.trim().toLowerCase();
        if (!vSlug(trimmedSlug)) {
            return c.json({ code: -1000, msg: "doc.update.slug_invalid", data: null });
        }

        // 查重：新 slug 不能已被其他文档占用（排除自身）
        const conflict = await db
            .select({ id: schema.docs.id })
            .from(schema.docs)
            .where(and(
                eq(schema.docs.slug, trimmedSlug),
                ne(schema.docs.id, id),
            ))
            .get();

        if (conflict) {
            return c.json({ code: -1000, msg: "doc.update.slug_exists", data: null });
        }
    }

    // 校验 status（若传入）
    if (status !== undefined && status !== "active" && status !== "inactive") {
        return c.json({ code: -1000, msg: "doc.update.status_invalid", data: null });
    }

    // 构建部分更新字段
    const updates: Record<string, any> = { updated_at: new Date() };
    if (notebook_id !== undefined) updates.notebook_id = notebook_id;
    if (slug !== undefined) updates.slug = trimmedSlug;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (keywords !== undefined) updates.keywords = keywords;
    if (status !== undefined) updates.status = status;

    const result = await db
        .update(schema.docs)
        .set(updates)
        .where(eq(schema.docs.id, id))
        .returning()
        .get();

    return c.json({
        code: 200,
        msg: "doc.update.success",
        data: result,
    });
};

/**
 * 删除公开文档（仅删 docs 记录，不动笔记本和笔记）
 */
export const deleteDoc = async (c: Context) => {
    const payload = await c.req.json();
    const { id } = payload || {};

    // 校验 id
    if (!id || typeof id !== "number") {
        return c.json({ code: -1000, msg: "doc.delete.id_required", data: null });
    }

    // 查询记录是否存在
    const existingDoc = await db
        .select({ id: schema.docs.id })
        .from(schema.docs)
        .where(eq(schema.docs.id, id))
        .get();

    if (!existingDoc) {
        return c.json({ code: -1000, msg: "doc.delete.not_found", data: null });
    }

    // 执行删除
    await db
        .delete(schema.docs)
        .where(eq(schema.docs.id, id))
        .run();

    return c.json({
        code: 200,
        msg: "doc.delete.success",
        data: null,
    });
};
