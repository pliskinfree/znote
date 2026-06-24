<script setup lang="ts">
/**
 * 新建笔记对话框
 *
 * 简化版：只输入标题，content 默认空，is_pinned 默认 0。
 * 父分类 id 由 props 传入（来自 store.activeCategoryId）。
 */
import { ref, watch } from "vue";
import { NInput, NModal } from "naive-ui";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
    show: boolean;
    /** 父分类名称（仅展示用） */
    categoryName?: string;
}>();

const emit = defineEmits<{
    (e: "update:show", value: boolean): void;
    (e: "confirm", title: string): void;
}>();

/** 输入框内容 */
const title = ref("");
/** 提交按钮加载态 */
const submitting = ref(false);

/** 弹窗打开时重置 */
watch(
    () => props.show,
    (val) => {
        if (val) {
            title.value = "";
            submitting.value = false;
        }
    },
);

/** 关闭 */
const handleClose = () => {
    emit("update:show", false);
};

/** 提交 */
const handleConfirm = () => {
    const trimmed = title.value.trim();
    if (!trimmed) return;
    submitting.value = true;
    emit("confirm", trimmed);
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t('note.note.create.title')"
    class="max-w-md"
    :mask-closable="!submitting"
    :close-on-esc="!submitting"
    @update:show="handleClose"
  >
    <NInput
      v-model:value="title"
      :placeholder="t('note.note.create.placeholder')"
      :disabled="submitting"
      maxlength="100"
      show-count
      @keydown.enter="handleConfirm"
    />
    <div v-if="categoryName" class="mt-3 text-xs text-slate-500">
      <span class="text-slate-400">归属分类：</span>
      <span class="text-slate-700">{{ categoryName }}</span>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          class="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          :disabled="submitting"
          @click="handleClose"
        >
          {{ t("note.dialog.cancel") }}
        </button>
        <button
          class="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!title.trim() || submitting"
          @click="handleConfirm"
        >
          {{ t("note.dialog.confirm") }}
        </button>
      </div>
    </template>
  </NModal>
</template>
