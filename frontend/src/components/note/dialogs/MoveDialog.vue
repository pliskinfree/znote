<script setup lang="ts">
/**
 * 移动笔记/分类弹窗
 *
 * 根据 type prop 区分移动笔记还是移动分类，调用不同的 API。
 * 展示当前笔记本下的分类树，用户选择目标分类后点保存即可移动。
 *
 * 移动分类时通过 excludeNodeIds 禁用自身及子孙节点，防止循环引用。
 */
import { computed, h, ref, watch } from "vue";
import { NButton, NModal, NTree } from "naive-ui";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";
import type { NotebookNode } from "@/types/note";
import type { TreeOption } from "naive-ui";

const { t } = useI18n();

const props = defineProps<{
    show: boolean;
    type: "note" | "category";
    sourceId: number;
    sourceName: string;
    notebookTree: NotebookNode[];
    excludeNodeIds?: number[];
    currentCategoryId?: number;
}>();

const emit = defineEmits<{
    (e: "update:show", val: boolean): void;
    (e: "confirm", targetId: number): void;
    (e: "cancel"): void;
}>();

const selectedId = ref<number | null>(null);

watch(
    () => props.show,
    (val) => {
        if (val) {
            selectedId.value = null;
        }
    },
);

const isMovingCategory = computed(() => props.type === "category");

const dialogTitle = computed(() =>
    isMovingCategory.value ? t("note.move.title_category") : t("note.move.title_note"),
);

const excludeSet = computed<Set<number>>(() => {
    const ids = new Set(props.excludeNodeIds ?? []);
    if (props.currentCategoryId !== undefined) {
        ids.add(props.currentCategoryId);
    }
    return ids;
});

/**
 * 递归将 NotebookNode 转为 NTree 的 TreeOption 格式
 * 排除节点标记为 disabled
 */
const convertToTreeOptions = (nodes: NotebookNode[]): TreeOption[] => {
    return nodes.map((node) => {
        const isExcluded = excludeSet.value.has(node.id);
        const isCurrent = node.id === props.currentCategoryId;
        const label = isCurrent ? `${node.title} (${t("note.move.current")})` : node.title;

        return {
            key: node.id,
            label,
            disabled: isExcluded,
            prefix: () =>
                h(ZIcon, {
                    name: isCurrent ? "ri:folder-open-line" : "ri:folder-line",
                    size: 15,
                    color: "currentColor",
                }),
            children: node.children.length > 0
                ? convertToTreeOptions(node.children)
                : undefined,
        };
    });
};

const treeData = computed<TreeOption[]>(() => convertToTreeOptions(props.notebookTree));

const selectedKeys = computed<string[]>(() => {
    if (selectedId.value === null) return [];
    return [String(selectedId.value)];
});

const handleUpdateSelected = (keys: string[]) => {
    if (keys.length > 0) {
        const id = Number(keys[0]);
        if (!excludeSet.value.has(id)) {
            selectedId.value = id;
        }
    } else {
        selectedId.value = null;
    }
};

const handlePositiveClick = () => {
    if (selectedId.value === null) return;
    emit("confirm", selectedId.value);
};

const handleNegativeClick = () => {
    emit("update:show", false);
    emit("cancel");
};
</script>

<template>
  <NModal
    v-model:show="props.show"
    preset="card"
    :title="dialogTitle"
    :mask-closable="false"
    style="width: 480px; max-height: 70vh"
    @update:show="(val: boolean) => emit('update:show', val)"
  >
    <div class="mb-3 text-sm text-slate-500">
      <span class="font-medium text-slate-700">{{ t("note.move.source") }}：</span>
      <span>{{ props.sourceName }}</span>
    </div>

    <div class="mb-1 text-xs text-slate-400">
      {{ t("note.move.select_target") }}
    </div>

    <div class="move-tree-container">
      <NTree
        v-if="treeData.length > 0"
        block-line
        :data="treeData"
        :selected-keys="selectedKeys"
        :selectable="true"
        :multiple="false"
        default-expand-all
        @update:selected-keys="handleUpdateSelected"
      />
      <div
        v-else
        class="py-8 text-center text-sm text-slate-400"
      >
        {{ t("note.notebook.empty_short") }}
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="handleNegativeClick">
          {{ t("note.dialog.cancel") }}
        </NButton>
        <NButton
          type="primary"
          :disabled="selectedId === null"
          @click="handlePositiveClick"
        >
          {{ t("note.move.save") }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.move-tree-container {
  max-height: 40vh;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 4px;
  background: #f8fafc;
}
</style>
