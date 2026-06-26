<script setup lang="ts">
/**
 * 笔记详情页
 * 获取笔记完整内容，使用 IncremarkContent 渲染 Markdown
 * 渲染完成后提取 H2/H3/H4 标题并通过 emit 传给父组件用于 TOC
 */
import { ref, watch, nextTick, onMounted, inject, type Ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { IncremarkContent } from "@incremark/vue";
import "@incremark/theme/styles.css";
import req from "@/utils/req";

const route = useRoute();
const { t } = useI18n();

/** 注入 slug */
const slug = inject<string>("slug", "");

/** 笔记内容 */
const note = ref<{
    id: number;
    title: string;
    content: string;
    created_at: number;
    updated_at: number;
} | null>(null);

/** 加载状态 */
const loading = ref(false);
const error = ref("");

/** 内容区域 DOM 引用 */
const contentRef = ref<HTMLElement | null>(null);

/** TOC 标题列表 */
const headings = inject<Ref<{ level: number; text: string; id: string }[]>>("headings", ref([]));

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

/** 提取渲染后的标题 DOM 并分配 ID（Incremark 异步渲染，需延迟） */
const extractHeadings = () => {
    // IncremarkContent 内部异步解析 markdown，需要等待渲染完成
    setTimeout(() => {
        if (!contentRef.value) return;
        const headingEls = contentRef.value.querySelectorAll("h2, h3, h4");
        const items: { level: number; text: string; id: string }[] = [];
        headingEls.forEach((el, i) => {
            const id = `heading-${i}`;
            el.id = id;
            items.push({
                level: parseInt(el.tagName[1]),
                text: el.textContent || "",
                id,
            });
        });
        headings.value = items;
    }, 300);
};

/** 获取笔记详情 */
const fetchNote = async (noteId: number) => {
    loading.value = true;
    error.value = "";
    note.value = null;
    headings.value = [];
    try {
        const res = await req.get(`/api/doc/${slug}/note/${noteId}`);
        if (res.data?.code === 200) {
            note.value = res.data.data;
            // 渲染后提取标题
            await nextTick();
            extractHeadings();
        } else {
            error.value = t(res.data?.msg || "doc.note.not_found");
        }
    } catch {
        error.value = t("doc.note.load_failed");
    } finally {
        loading.value = false;
    }
};

/** 路由变化时重新加载 */
onMounted(() => {
    const noteId = Number(route.params.noteId);
    if (noteId) fetchNote(noteId);
});

watch(
    () => route.params.noteId,
    (newId) => {
        const noteId = Number(newId);
        if (noteId) fetchNote(noteId);
    },
);
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-8">
    <!-- 加载中 -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
    </div>

    <!-- 错误 -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-24 text-slate-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 opacity-50">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span class="text-sm">{{ error }}</span>
    </div>

    <!-- 笔记内容 -->
    <template v-else-if="note">
      <!-- 笔记标题 -->
      <h1 class="mb-2 text-2xl font-bold text-slate-900">{{ note.title }}</h1>
      <!-- 元信息 -->
      <div class="mb-8 text-xs text-slate-400">
        <span v-if="note.updated_at">{{ t("doc.note.updated_at") }}: {{ formatDate(note.updated_at) }}</span>
      </div>

      <!-- Markdown 内容渲染 -->
      <div ref="contentRef" class="doc-content">
        <IncremarkContent :content="note.content" :is-finished="true" />
      </div>
    </template>
  </div>
</template>

<style>
/* 可选的全局样式覆盖，确保 Incremark 内容在文档页中显示良好 */
.doc-content {
  line-height: 1.75;
  color: #334155;
}
.doc-content h1 { font-size: 1.75rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #0f172a; }
.doc-content h2 { font-size: 1.4rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.5rem; color: #1e293b; padding-bottom: 0.3rem; border-bottom: 1px solid #e2e8f0; }
.doc-content h3 { font-size: 1.15rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #334155; }
.doc-content h4 { font-size: 1rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #475569; }
.doc-content p { margin-bottom: 0.75rem; }
.doc-content ul, .doc-content ol { margin-bottom: 0.75rem; padding-left: 1.5rem; }
.doc-content li { margin-bottom: 0.25rem; }
.doc-content a { color: #2563eb; text-decoration: underline; }
.doc-content blockquote { border-left: 3px solid #cbd5e1; padding-left: 1rem; margin: 1rem 0; color: #64748b; }
.doc-content code { background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
.doc-content pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
.doc-content pre code { background: none; padding: 0; color: inherit; }
.doc-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
.doc-content th, .doc-content td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
.doc-content th { background: #f8fafc; font-weight: 600; }
.doc-content img { max-width: 100%; border-radius: 0.375rem; }
</style>
