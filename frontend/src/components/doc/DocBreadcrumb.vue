<script setup lang="ts">
/**
 * 文档页面面包屑导航
 * - 首页：不显示面包屑
 * - 笔记页：文档标题 → 各级分类 → 笔记标题
 */
import { computed, inject, ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();

const slug = inject<string>("slug", "");
const tree = inject<Ref<any[]>>("docTree", ref([]));
const activeNoteId = inject<Ref<number | null>>("activeNoteId", ref(null));

/* ===== 数据类型 ===== */
interface DocNode {
    id: number; title: string; type: string;
    children: DocNode[];
    notes: { id: number; title: string; type: string }[];
}

/** 递归在树中查找包含指定笔记的分类路径（不含笔记自身） */
const findNotePath = (nodes: DocNode[], noteId: number, path: DocNode[]): DocNode[] | null => {
    for (const node of nodes) {
        if (node.notes && node.notes.some((n) => n.id === noteId)) return [...path, node];
        if (node.children && node.children.length > 0) {
            const r = findNotePath(node.children, noteId, [...path, node]);
            if (r) return r;
        }
    }
    return null;
};

/** 获取当前笔记标题 */
const currentNoteTitle = computed(() => {
    if (!activeNoteId.value) return "";
    for (const root of tree.value) {
        const found = findNoteInTree(root, activeNoteId.value);
        if (found) return found;
    }
    return "";
});

/** 递归查找笔记标题 */
const findNoteInTree = (node: DocNode, noteId: number): string | null => {
    const note = (node.notes || []).find((n) => n.id === noteId);
    if (note) return note.title;
    for (const child of node.children || []) {
        const r = findNoteInTree(child, noteId);
        if (r) return r;
    }
    return null;
};

interface Crumb {
    label: string;
    to?: string;
}

const items = computed<Crumb[]>(() => {
    const crumbs: Crumb[] = [];
    const noteId = activeNoteId.value;
    if (!noteId || tree.value.length === 0) return crumbs;

    // 分类路径
    const path = findNotePath(tree.value, noteId, []);
    if (path) {
        for (const node of path) {
            crumbs.push({ label: node.title });
        }
    }
    // 笔记标题（最后一项）
    crumbs.push({ label: currentNoteTitle.value });

    return crumbs;
});
</script>

<template>
  <nav
    v-if="activeNoteId !== null && items.length > 0"
    class="flex items-center gap-1.5 pt-5 pb-2 text-xs text-slate-500"
  >
    <!-- 文档首页链接 -->
    <a class="cursor-pointer transition hover:text-blue-600" @click="router.push(`/doc/${slug}`)">{{ t("doc.breadcrumb.home") }}</a>

    <template v-for="(crumb, index) in items" :key="index">
      <span class="text-slate-300">/</span>
      <span :class="index === items.length - 1 ? 'font-medium text-slate-700' : ''">
        {{ crumb.label }}
      </span>
    </template>
  </nav>
</template>
