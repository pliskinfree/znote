<script setup lang="ts">
/**
 * 删除分类确认对话框
 *
 * 用户输入分类名称确认后，触发 @confirm 事件，由父组件调用后端 API 完成删除。
 * 确认按钮在输入值不匹配分类名称时保持 disabled。
 */
import { ref, watch } from "vue";
import { NInput, NModal } from "naive-ui";
import { useI18n } from "vue-i18n";
import type { NotebookNode } from "@/types/note";

const { t } = useI18n();

const props = defineProps<{
    show: boolean;
    /** 待删除的分类节点 */
    node: NotebookNode | null;
}>();

const emit = defineEmits<{
    (e: "update:show", value: boolean): void;
    (e: "confirm"): void;
}>();

/** 用户输入的确认文本 */
const confirmValue = ref("");
/** 提交按钮加载态 */
const submitting = ref(false);

/** 弹窗打开时重置状态 */
watch(
    () => props.show,
    (val) => {
        if (val) {
            confirmValue.value = "";
            submitting.value = false;
        }
    },
);

/** 关闭弹窗 */
const handleClose = () => {
    emit("update:show", false);
};

/** 确认删除 */
const handleConfirm = () => {
    if (!props.node || confirmValue.value.trim() !== props.node.title) return;
    submitting.value = true;
    emit("confirm");
};

/** 外部完成操作后调用此方法恢复正常状态 */
const resetSubmitting = () => {
    submitting.value = false;
};

defineExpose({ resetSubmitting });
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t('note.category.delete.title')"
    class="max-w-md"
    :mask-closable="!submitting"
    :close-on-esc="!submitting"
    @update:show="handleClose"
  >
    <div class="text-sm leading-relaxed text-slate-600">
      <p>
        {{ t('note.category.delete.warning_prefix', { title: node?.title ?? '' }) }}
      </p>
      <p class="mt-1 text-slate-500">
        {{ t('note.category.delete.hint') }}
      </p>
    </div>
    <div class="mt-4">
      <NInput
        v-model:value="confirmValue"
        :placeholder="t('note.category.delete.placeholder')"
        :disabled="submitting"
        maxlength="50"
        @keydown.enter="handleConfirm"
      />
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
          class="rounded-md bg-red-600 px-4 py-1.5 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="confirmValue.trim() !== node?.title || submitting"
          @click="handleConfirm"
        >
          {{ t("note.category.delete.confirm_text") }}
        </button>
      </div>
    </template>
  </NModal>
</template>
