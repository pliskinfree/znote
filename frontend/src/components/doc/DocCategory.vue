<script setup lang="ts">
/**
 * 分类页：展示某个分类下的所有笔记列表
 * 类似 DocHome 的目录列表，但范围限定为该分类及其子分类
 */
import { computed, inject, ref, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const tree = inject<Ref<any[]>>("docTree", ref([]));
const slug = inject<string>("slug", "");

/** 当前分类 ID */
const notebookId = computed(() => Number(route.params.notebookId));

/** 递归查找指定分类节点 */
const findNode = (nodes: any[], id: number): any | null => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

/** 当前分类节点 */
const categoryNode = computed(() => findNode(tree.value, notebookId.value));

/** 递归收集该分类及其子分类下的所有笔记 */
const collectNotes = (node: any): any[] => {
    const notes: any[] = [...(node.notes || [])];
    for (const child of node.children || []) {
        notes.push(...collectNotes(child));
    }
    return notes;
};

/** 该分类下的所有笔记（含子分类） */
const allNotes = computed(() => {
    if (!categoryNode.value) return [];
    return collectNotes(categoryNode.value);
});

/** 格式化日期 */
const formatDate = (val: any): string => {
    if (!val) return "";
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

/** 点击笔记跳转 */
const goToNote = (noteId: number) => {
    router.push(`/doc/${slug}/note-${noteId}`);
};
</script>

<template>
  <div v-if="categoryNode">
    <!-- 分类标题 -->
    <div class="mb-4 flex items-baseline gap-2">
      <ZIcon name="ri:folder-line" :size="18" class="text-slate-400 flex-shrink-0" />
      <h1 class="text-lg font-semibold text-slate-800">{{ categoryNode.title }}</h1>
      <span class="text-xs text-slate-400">{{ allNotes.length }} {{ t("doc.home.note_count") }}</span>
    </div>

    <!-- 笔记列表 -->
    <template v-if="allNotes.length > 0">
      <div
        v-for="note in allNotes"
        :key="note.id"
        class="group flex cursor-pointer items-center rounded-lg px-3 py-2 transition hover:bg-slate-50"
        @click="goToNote(note.id)"
      >
        <div class="flex w-full items-center gap-2">
          <ZIcon name="ri:file-text-line" :size="14" class="flex-shrink-0 text-slate-300 group-hover:text-blue-400" />
          <span class="truncate text-sm text-slate-700 group-hover:text-blue-600">{{ note.title }}</span>
          <span class="mx-2 flex-1 border-b border-dashed border-slate-200" />
          <span class="flex-shrink-0 text-xs text-slate-400">{{ formatDate(note.updated_at) }}</span>
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <div v-else class="py-16 text-center text-xs text-slate-400">
      {{ t("doc.home.empty") }}
    </div>
  </div>

  <!-- 分类不存在 -->
  <div v-else class="py-16 text-center text-xs text-slate-400">
    {{ t("doc.search.no_results") }}
  </div>
</template>
