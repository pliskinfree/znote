<script setup lang="ts">
/**
 * 递归文档树节点
 * - 分类节点：点击箭头可折叠/展开子节点，点击名称高亮（桌面端跳转到分类附近）
 * - 笔记节点：点击跳转到笔记详情页面
 */
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const props = defineProps<{
    /** 树节点数据 */
    node: {
        id: number;
        title: string;
        type: "notebook";
        children: any[];
        notes: { id: number; title: string; type: "note" }[];
    };
    /** 当前文档 slug */
    slug: string;
    /** 当前激活的笔记 ID */
    activeNoteId: number | null;
    /** 搜索关键词（用于高亮） */
    searchKeyword: string;
}>();

/** 分类节点是否展开 */
const expanded = ref(true);

/** 当前分类是否处于激活路径（其下有当前笔记） */
const isActive = computed(() => {
    if (!props.activeNoteId) return false;
    // 检查直接笔记
    if (props.node.notes.some((n) => n.id === props.activeNoteId)) return true;
    // 递归检查子分类
    return props.node.children.some((c) => checkChildActive(c));
});

/** 递归检查子分类是否包含当前笔记 */
const checkChildActive = (child: any): boolean => {
    if (child.notes && child.notes.some((n: any) => n.id === props.activeNoteId)) return true;
    if (child.children) return child.children.some((c: any) => checkChildActive(c));
    return false;
};

/** 切换展开/折叠 */
const toggleExpand = () => {
    expanded.value = !expanded.value;
};

/** 点击笔记跳转 */
const goToNote = (noteId: number) => {
    router.push(`/doc/${props.slug}/note/${noteId}`);
};

/** 高亮匹配关键词 */
const highlightText = (text: string): string => {
    if (!props.searchKeyword) return text;
    const regex = new RegExp(`(${escapeRegex(props.searchKeyword)})`, "gi");
    return text.replace(regex, "<mark class='bg-yellow-200 rounded px-0.5'>$1</mark>");
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
</script>

<template>
  <div class="select-none">
    <!-- 分类标题行 -->
    <div
      class="group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm transition"
      :class="isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'"
    >
      <!-- 折叠箭头 -->
      <button
        class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-slate-400 transition hover:text-slate-600"
        @click="toggleExpand"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12" height="12"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          class="transition-transform"
          :class="expanded ? 'rotate-90' : ''"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      <!-- 分类图标 -->
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="flex-shrink-0 opacity-60">
        <path v-if="expanded" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        <path v-else d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="truncate text-xs font-medium" v-html="highlightText(node.title)"></span>
      <!-- 笔记数量 -->
      <span class="ml-auto flex-shrink-0 text-xs text-slate-400">{{ node.notes.length + node.children.reduce((s: number, c: any) => s + (c.notes?.length || 0), 0) }}</span>
    </div>

    <!-- 子节点列表 -->
    <div v-show="expanded" class="ml-3 border-l border-slate-200 pl-2">
      <!-- 笔记条目 -->
      <div
        v-for="note in node.notes"
        :key="note.id"
        class="group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition"
        :class="activeNoteId === note.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-100'"
        @click="goToNote(note.id)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="flex-shrink-0 opacity-50">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <span class="truncate" v-html="highlightText(note.title)"></span>
      </div>

      <!-- 子分类（递归） -->
      <DocTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :slug="slug"
        :active-note-id="activeNoteId"
        :search-keyword="searchKeyword"
      />
    </div>
  </div>
</template>
