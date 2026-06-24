<script setup lang="ts">
/**
 * 新建笔记本 / 新建子分类的通用对话框
 *
 * 通过 parentId 区分两种用途：
 *   - parentId 为 null/undefined：新建顶层笔记本
 *   - parentId 有值：在指定分类下新建子分类
 */
import { ref, watch } from "vue";
import { NInput, NModal } from "naive-ui";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
    show: boolean;
    /** 父分类 id，新建顶层笔记本时传 null/undefined */
    parentId?: number | null;
    /** 父分类名称（仅在新建子分类时用于展示） */
    parentName?: string;
}>();

const emit = defineEmits<{
    (e: "update:show", value: boolean): void;
    (e: "confirm", title: string): void;
}>();

/** 输入框内容 */
const title = ref("");
/** 提交按钮加载态 */
const submitting = ref(false);

/** 弹窗打开时重置输入 */
watch(
    () => props.show,
    (val) => {
        if (val) {
            title.value = "";
            submitting.value = false;
        }
    },
);

/** 关闭弹窗 */
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

/** 标题文案：区分"新建笔记本"和"新建子分类" */
const dialogTitle = () => {
    if (props.parentId) {
        return t("note.category.create.title");
    }
    return t("note.notebook.create.title");
};

/** placeholder 文案 */
const placeholder = () => {
    if (props.parentId) {
        return t("note.category.create.placeholder");
    }
    return t("note.notebook.create.placeholder");
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="dialogTitle()"
    class="max-w-md"
    :mask-closable="!submitting"
    :close-on-esc="!submitting"
    @update:show="handleClose"
  >
    <NInput
      v-model:value="title"
      :placeholder="placeholder()"
      :disabled="submitting"
      maxlength="50"
      show-count
      @keydown.enter="handleConfirm"
    />
    <!-- 父分类提示（仅新建子分类时显示） -->
    <div v-if="parentId && parentName" class="mt-3 text-xs text-slate-500">
      <span class="text-slate-400">归属：</span>
      <span class="text-slate-700">{{ parentName }}</span>
    </div>

    <!-- 底部按钮 -->
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
