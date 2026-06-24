<script setup lang="ts">
/**
 * 笔记工作台主页面
 *
 * 三栏布局：
 *   Col-1（240px）：用户信息 + 笔记本下拉 + 分类树
 *   Col-2（320px）：搜索 + 新建笔记 + 笔记列表
 *   Col-3（flex-1）：笔记标题 + 元信息 + Vditor 编辑器
 *
 * 核心状态由 stores/note.ts 统一管理，本组件只负责编排和事件转发。
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { NSpin, useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";
import UserHeader from "@/components/note/UserHeader.vue";
import NotebookSwitcher from "@/components/note/NotebookSwitcher.vue";
import CategoryTree from "@/components/note/CategoryTree.vue";
import NoteList from "@/components/note/NoteList.vue";
import NoteEditor from "@/components/note/NoteEditor.vue";
import NoteMetaBar from "@/components/note/NoteMetaBar.vue";
import CreateNotebookDialog from "@/components/note/dialogs/CreateNotebookDialog.vue";
import CreateNoteDialog from "@/components/note/dialogs/CreateNoteDialog.vue";
import { useNoteStore } from "@/stores/note";
import { useUserStore } from "@/stores/user";
import type { NotebookNode } from "@/types/note";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const message = useMessage();
const noteStore = useNoteStore();
const userStore = useUserStore();

// ==================== 弹窗控制 ====================

/** 新建笔记本 Dialog 显隐 */
const showCreateNotebook = ref(false);
/** 新建子分类 Dialog 显隐 */
const showCreateCategory = ref(false);
/** 新建笔记 Dialog 显隐 */
const showCreateNote = ref(false);
/** 新建子分类时，传入的父分类信息 */
const newCategoryParent = ref<{ id: number; name: string } | null>(null);

// ==================== 计算属性 ====================

/** 当前选中笔记本的子分类树（用于 CategoryTree） */
const currentCategoryTree = computed<NotebookNode[]>(() => {
    if (noteStore.activeNotebookId === null) return [];
    const top = noteStore.categoryTree.find((nb) => nb.id === noteStore.activeNotebookId);
    if (!top) return [];
    return top.children;
});

/** 当前激活的笔记所在分类名（用于元信息条） */
const activeCategoryName = computed(() => {
    const cat = noteStore.activeCategory;
    return cat?.title ?? "-";
});

/** 是否有选中的笔记（用于第三栏内容切换） */
const hasActiveNote = computed(() => noteStore.activeNoteId !== null && noteStore.activeNote !== null);

// ==================== 数据加载 ====================

/**
 * 页面挂载时：
 * 1. 检查登录态
 * 2. 加载用户信息
 * 3. 加载笔记本树
 */
onMounted(async () => {
    const ok = await userStore.checkLogin();
    if (!ok) return;

    await userStore.getUserInfo();
    await noteStore.loadNotebookTree();
});

/** 路由 query 变化时支持深链（可选） */
watch(
    () => route.query,
    () => {
        // 占位：未来支持 ?note=123 这种深链
    },
);

// ==================== 事件处理 ====================

/** 路由跳转（UserHeader 菜单） */
const handleNavigate = (path: string) => {
    void router.push(path);
};

/** 切换顶层笔记本 */
const handleSwitchNotebook = (id: number | null) => {
    if (id !== null) {
        noteStore.switchNotebook(id);
    }
};

/** 打开"新建笔记本"Dialog */
const handleOpenCreateNotebook = () => {
    showCreateNotebook.value = true;
};

/** 提交"新建笔记本" */
const handleConfirmCreateNotebook = async (title: string) => {
    const result = await noteStore.createNotebook({ title, parent_id: null });
    if (result) {
        showCreateNotebook.value = false;
        // 自动切换到新建的笔记本
        noteStore.switchNotebook(result.id);
    } else {
        // 失败时给出提示
        // （API 层未抛错，简化处理：关闭弹窗）
        showCreateNotebook.value = false;
    }
};

/** 选中分类 */
const handleSelectCategory = async (id: number) => {
    await noteStore.selectCategory(id);
};

/** 打开"新建子分类"Dialog */
const handleAddChild = (parentId: number, title: string) => {
    // 旧的 prompt 路径保留兼容：直接调用 API
    void doCreateCategory(parentId, title);
};

/** 实际创建子分类 */
const doCreateCategory = async (parentId: number, title: string) => {
    const result = await noteStore.createNotebook({ title, parent_id: parentId });
    if (result) {
        // 选中新建的分类
        await noteStore.selectCategory(result.id);
    }
};

/** 打开"新建子分类"Dialog（用 Dialog 方式） */
const openCreateCategoryDialog = (parentId: number, parentName: string) => {
    newCategoryParent.value = { id: parentId, name: parentName };
    showCreateCategory.value = true;
};

/** 提交"新建子分类" */
const handleConfirmCreateCategory = async (title: string) => {
    if (!newCategoryParent.value) return;
    await doCreateCategory(newCategoryParent.value.id, title);
    showCreateCategory.value = false;
};

/** 打开"新建笔记"Dialog */
const handleOpenCreateNote = () => {
    if (noteStore.activeCategoryId === null) {
        message.warning(t("note.note.create.placeholder"));
        return;
    }
    showCreateNote.value = true;
};

/** 提交"新建笔记" */
const handleConfirmCreateNote = async (title: string) => {
    if (noteStore.activeCategoryId === null) return;
    const result = await noteStore.createNote({
        notebook_id: noteStore.activeCategoryId,
        title,
        content: "",
    });
    if (result) {
        showCreateNote.value = false;
        // 自动选中新创建的笔记
        noteStore.selectNote(result.id);
    } else {
        showCreateNote.value = false;
    }
};

/** 选中笔记 */
const handleSelectNote = (id: number) => {
    noteStore.selectNote(id);
};

/** 编辑器内容变更（v2 实现保存时使用） */
const handleEditorChange = (_value: string) => {
    // 占位：v2 接入 updateNote 接口
};
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#f7f8fa]">
    <!-- ==================== 第一栏：导航 ==================== -->
    <aside class="flex w-60 shrink-0 flex-col border-r border-slate-200/60 bg-white">
      <!-- 用户信息 -->
      <div class="border-b border-slate-200/60 p-3">
        <UserHeader @navigate="handleNavigate" />
      </div>

      <!-- 笔记本下拉 + 新建按钮 -->
      <div class="border-b border-slate-200/60 p-3">
        <NotebookSwitcher
          :notebooks="noteStore.topNotebooks"
          :model-value="noteStore.activeNotebookId"
          @update:model-value="handleSwitchNotebook"
          @create="handleOpenCreateNotebook"
        />
      </div>

      <!-- 分类树 -->
      <div class="flex-1 overflow-y-auto p-2">
        <NSpin v-if="noteStore.loading.tree" class="block py-6" />
        <CategoryTree
          v-else
          :tree="currentCategoryTree"
          :active-id="noteStore.activeCategoryId"
          @select="handleSelectCategory"
          @add-child="(id: number, title: string) => handleAddChild(id, title)"
        />
      </div>
    </aside>

    <!-- ==================== 第二栏：笔记列表 ==================== -->
    <aside class="flex w-80 shrink-0 flex-col border-r border-slate-200/60 bg-white">
      <NoteList
        :notes="noteStore.displayedNotes"
        :active-id="noteStore.activeNoteId"
        :loading="noteStore.loading.notes"
        :disabled-create="noteStore.activeCategoryId === null"
        @select="handleSelectNote"
        @create="handleOpenCreateNote"
      />
    </aside>

    <!-- ==================== 第三栏：编辑器 ==================== -->
    <main class="flex flex-1 flex-col overflow-hidden">
      <!-- 选中笔记时：编辑器 -->
      <template v-if="hasActiveNote && noteStore.activeNote">
        <!-- 顶部：标题 + 元信息 -->
        <div class="shrink-0 border-b border-slate-200/60 bg-white px-8 py-4">
          <h1 class="text-xl font-semibold text-slate-800">
            {{ noteStore.activeNote.title || t("note.editor.placeholder") }}
          </h1>
          <div class="mt-2">
            <NoteMetaBar :note="noteStore.activeNote" :category-name="activeCategoryName" />
          </div>
        </div>

        <!-- 编辑器主体 -->
        <div class="flex-1 overflow-hidden bg-white p-6">
          <NoteEditor
            :model-value="noteStore.activeNote.content"
            height="100%"
            @update:model-value="handleEditorChange"
          />
        </div>
      </template>

      <!-- 未选中时：空态 -->
      <div v-else class="flex flex-1 items-center justify-center bg-[#f7f8fa]">
        <div class="flex flex-col items-center gap-3 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <ZIcon name="ri:notebook-2-line" :size="32" color="#94a3b8" />
          </div>
          <div>
            <p class="text-base font-medium text-slate-700">{{ t("note.empty.workspace.title") }}</p>
            <p class="mt-1 text-sm text-slate-400">{{ t("note.empty.workspace.desc") }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- ==================== Dialogs ==================== -->
    <!-- 新建笔记本 -->
    <CreateNotebookDialog
      v-model:show="showCreateNotebook"
      :parent-id="null"
      @confirm="handleConfirmCreateNotebook"
    />

    <!-- 新建子分类 -->
    <CreateNotebookDialog
      v-model:show="showCreateCategory"
      :parent-id="newCategoryParent?.id ?? null"
      :parent-name="newCategoryParent?.name"
      @confirm="handleConfirmCreateCategory"
    />

    <!-- 新建笔记 -->
    <CreateNoteDialog
      v-model:show="showCreateNote"
      :category-name="activeCategoryName"
      @confirm="handleConfirmCreateNote"
    />
  </div>
</template>
