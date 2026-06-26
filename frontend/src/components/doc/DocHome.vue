<script setup lang="ts">
/**
 * 文档首页·语雀式目录清单
 * 按分类分组，平铺展示所有笔记，格式：左侧标题 | 右侧更新时间
 */
import { computed, inject, ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();

const tree = inject<Ref<any[]>>("docTree", ref([]));
const slug = inject<string>("slug", "");

/** 格式化日期（接受 Unix 秒数或 ISO 字符串） */
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

/** 递归计算分类及其子分类下的笔记总数 */
const countAllNotes = (node: any): number => {
    let count = (node.notes || []).length;
    for (const child of node.children || []) {
        count += countAllNotes(child);
    }
    return count;
};

/** 递归平铺：按分类分组输出笔记列表 */
const flattenTree = (nodes: any[]): { category: any; notes: any[] }[] => {
    const result: { category: any; notes: any[] }[] = [];
    for (const node of nodes) {
        // 当前分类的笔记
        if (node.notes && node.notes.length > 0) {
            result.push({ category: node, notes: node.notes });
        }
        // 递归子分类
        if (node.children && node.children.length > 0) {
            result.push(...flattenTree(node.children));
        }
    }
    return result;
};

const sections = computed(() => flattenTree(tree.value));

/** 点击笔记跳转 */
const goToNote = (noteId: number) => {
    router.push(`/doc/${slug}/note/${noteId}`);
};
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-8">
    <!-- 空状态 -->
    <div
      v-if="tree.length === 0"
      class="flex flex-col items-center justify-center py-24 text-slate-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mb-3 opacity-40">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
      <span class="text-sm">{{ t("doc.home.empty") }}</span>
    </div>

    <!-- 分类分组列表 -->
    <template v-else>
      <div
        v-for="section in sections"
        :key="section.category.id"
        class="mb-6"
      >
        <!-- 分类标题行：名称 | 笔记数量 -->
        <div class="mb-2 flex items-baseline gap-2 border-b border-slate-100 pb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-400 flex-shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <h3 class="font-semibold text-slate-800">{{ section.category.title }}</h3>
          <span class="text-xs text-slate-400">{{ countAllNotes(section.category) }} {{ t("doc.home.note_count") }}</span>
        </div>

        <!-- 笔记条目列表：标题 ···· 更新时间 -->
        <div
          v-for="note in section.notes"
          :key="note.id"
          class="group flex cursor-pointer items-center rounded-lg px-3 py-2 transition hover:bg-slate-50"
          @click="goToNote(note.id)"
        >
          <div class="flex w-full items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="flex-shrink-0 text-slate-300 group-hover:text-blue-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="truncate text-sm text-slate-700 group-hover:text-blue-600">{{ note.title }}</span>
            <span class="mx-2 flex-1 border-b border-dashed border-slate-200" />
            <span class="flex-shrink-0 text-xs text-slate-400">{{ formatDate(note.updated_at || note.created_at) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
