import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * 校验笔记本是否属于当前用户
 * @param notebookId 笔记本 ID
 * @param userId     用户 ID
 * @returns 属于该用户返回 true，否则 false
 */
export const checkNotebookOwnership = async (notebookId: number, userId: number) => {
    const node = await db
        .select({ id: schema.notebooks.id })
        .from(schema.notebooks)
        .where(and(
            eq(schema.notebooks.id, notebookId),
            eq(schema.notebooks.user_id, userId),
        ))
        .get();
    return !!node;
};

/**
 * 校验笔记是否属于当前用户
 * @param noteId 笔记 ID
 * @param userId 用户 ID
 * @returns 属于该用户返回 true，否则 false
 */
export const checkNoteOwnership = async (noteId: number, userId: number) => {
    const note = await db
        .select({ id: schema.notes.id })
        .from(schema.notes)
        .where(and(
            eq(schema.notes.id, noteId),
            eq(schema.notes.user_id, userId),
        ))
        .get();
    return !!note;
};
