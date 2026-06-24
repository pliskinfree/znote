<script setup lang="ts">
/**
 * Vditor Markdown 编辑器封装
 *
 * 关键点：
 * 1. Vditor 体积较大，使用动态 import + 局部样式按需加载，避免污染其他页面
 * 2. 监听 modelValue 变化以同步外部值到编辑器
 * 3. 暴露 focus / setValue 等方法给父组件
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
    modelValue: string;
    /** 编辑器高度（CSS 值，如 '100%' 或 '500px'） */
    height?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "ready"): void;
}>();

/** Vditor 实例引用 */
let vditor: any = null;

/** 容器 DOM 引用 */
const editorEl = ref<HTMLElement | null>(null);

/**
 * 初始化 Vditor
 * 使用动态 import 按需加载，避免主包体过大
 */
const initVditor = async () => {
    if (!editorEl.value) return;

    // 动态加载 Vditor 库与样式（仅在进入编辑器时才加载）
    const { default: Vditor } = await import("vditor");
    await import("vditor/dist/index.css");

    vditor = new Vditor(editorEl.value, {
        mode: "ir",                     // 即时渲染模式，贴近思源笔记体验
        height: props.height || "100%",
        minHeight: 400,
        placeholder: t("note.editor.placeholder"),
        value: props.modelValue,
        // 关闭本地缓存，避免敏感内容残留浏览器
        cache: { enable: false },
        // 工具栏：常用功能即可
        toolbar: [
            "headings",
            "bold",
            "italic",
            "strike",
            "|",
            "list",
            "ordered-list",
            "check",
            "|",
            "quote",
            "code",
            "inline-code",
            "|",
            "link",
            "upload",
            "|",
            "undo",
            "redo",
        ],
        // 输入回调：同步到父组件
        input: (value: string) => {
            emit("update:modelValue", value);
        },
        // 初始化完成
        after: () => {
            emit("ready");
        },
    });
};

/** 组件挂载时初始化 */
onMounted(() => {
    void initVditor();
});

/** 组件卸载前销毁实例，避免内存泄漏 */
onBeforeUnmount(() => {
    if (vditor) {
        try {
            vditor.destroy();
        } catch {
            // 忽略销毁异常
        }
        vditor = null;
    }
});

/** 监听外部值变化（切换笔记时同步） */
watch(
    () => props.modelValue,
    (val) => {
        if (vditor && val !== vditor.getValue()) {
            vditor.setValue(val || "");
        }
    },
);
</script>

<template>
  <!-- Vditor 会接管该 div 的内容 -->
  <div ref="editorEl" class="vditor-wrapper h-full w-full" />
</template>

<style scoped>
/* 限制 vditor 样式只在当前组件作用域生效（Vditor 自身的样式仍为全局，
   但我们控制容器的尺寸和边框即可） */
.vditor-wrapper {
  border-radius: 0.5rem;
}
</style>
