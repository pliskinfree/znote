<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();

defineProps<{
    /** 文档标题 */
    title: string;
}>();

const emit = defineEmits<{
    (e: "toggle-sidebar"): void;
}>();

/** 返回应用首页 */
const goHome = () => {
    router.push("/");
};
</script>

<template>
  <header class="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4">
    <div class="flex items-center gap-3">
      <!-- 移动端汉堡按钮 -->
      <button
        class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
        @click="emit('toggle-sidebar')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <span class="truncate text-sm font-semibold text-slate-800">{{ title }}</span>
    </div>
    <button
      class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      @click="goHome"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      {{ t("doc.header.home") }}
    </button>
  </header>
</template>
