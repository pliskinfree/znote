<script setup lang="ts">
/**
 * 笔记本下拉切换器
 *
 * 功能：
 * 1. 展示所有顶层笔记本（parent_id === null）
 * 2. 切换时通知父组件更新 activeNotebookId
 * 3. 右侧"+"按钮触发新建笔记本（弹出 Dialog）
 *
 * Props:
 *   - notebooks: 顶层笔记本列表
 *   - modelValue: 当前选中的笔记本 id
 *
 * Emits:
 *   - update:modelValue: 切换笔记本
 *   - create: 请求新建笔记本
 */
import { computed } from "vue";
import { NSelect } from "naive-ui";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";
import type { Notebook } from "@/types/note";

const { t } = useI18n();

const props = defineProps<{
    notebooks: Notebook[];
    modelValue: number | null;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: number | null): void;
    (e: "create"): void;
}>();

/** NSelect 选项数据 */
const options = computed(() =>
    props.notebooks.map((nb) => ({
        label: nb.title,
        value: nb.id,
    })),
);

/** 切换选中 */
const handleChange = (value: number | null) => {
    emit("update:modelValue", value);
};

/** NSelect 深色主题覆盖（适配第一栏深色背景） */
const selectDarkTheme = {
    peers: {
        InternalSelection: {
            color: "rgba(71, 85, 105, 0.5)",          // slate-600/50
            colorActive: "rgba(71, 85, 105, 0.7)",
            colorFocus: "rgba(96, 165, 250, 0.25)",   // blue-400/25
            border: "1px solid rgba(71, 85, 105, 0.6)",
            borderHover: "1px solid rgba(96, 165, 250, 0.5)",
            borderFocus: "1px solid rgba(96, 165, 250, 0.6)",
            textColor: "rgb(226, 232, 240)",            // slate-200
            placeholderColor: "rgba(148, 163, 184, 0.7)",
        },
        InternalSelectMenu: {
            color: "rgb(30, 41, 59)",                  // slate-800
        },
    },
};
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- 笔记本下拉 -->
    <div class="min-w-0 flex-1">
      <NSelect
        :value="modelValue"
        :options="options"
        :placeholder="t('note.notebook.switcher.placeholder')"
        size="small"
        :consistent-menu-width="false"
        :theme-overrides="selectDarkTheme"
        @update:value="handleChange"
      />
    </div>
    <!-- 新建笔记本按钮 -->
    <button
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700/50 text-slate-300 transition hover:border-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
      :title="t('note.notebook.create.button')"
      @click="emit('create')"
    >
      <ZIcon name="ri:add-line" :size="16" color="currentColor" />
    </button>
  </div>
</template>
