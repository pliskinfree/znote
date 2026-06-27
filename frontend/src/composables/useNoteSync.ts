/**
 * 笔记后台同步 composable
 *
 * 当浏览器标签页不可见（hidden）时，启动 30s 定时轮询后端 API，
 * 静默刷新分类树、当前分类笔记列表和激活笔记数据。
 * 标签页恢复可见时停止轮询，并执行一次即时刷新（跳过激活笔记，避免覆盖正在编辑的内容）。
 *
 * 设计要点：
 * 1. 搜索模式 / 回收站模式下跳过轮询
 * 2. 编辑器有未保存修改（dirty）时跳过激活笔记刷新
 * 3. 静默刷新不触发 loading 状态，不写 sessionStorage
 * 4. 组件卸载时自动清理定时器和事件监听
 */
import { onBeforeUnmount, ref, type Ref } from "vue";
import { useNoteStore } from "@/stores/note";

/** 后台轮询间隔（毫秒） */
const POLL_INTERVAL = 30_000;

export function useNoteSync(dirtyRef: Ref<boolean>) {
    const noteStore = useNoteStore();

    /** 当前标签页是否可见 */
    const isTabVisible = ref(!document.hidden);
    /** 轮询定时器 */
    let timer: ReturnType<typeof setInterval> | null = null;

    /**
     * 执行一次静默刷新
     * @param options.skipActiveNote 是否跳过激活笔记刷新（标签页激活时跳过）
     */
    const silentRefresh = async (options: { skipActiveNote?: boolean } = {}) => {
        // 搜索模式 / 回收站模式下跳过，避免覆盖用户当前视图
        if (noteStore.searchMode || noteStore.trashMode) return;

        await noteStore.silentRefreshTree();
        await noteStore.silentRefreshCategoryNotes();

        // 仅在无未保存修改且允许刷新激活笔记时，更新激活笔记数据
        if (!options.skipActiveNote && !dirtyRef.value) {
            await noteStore.silentRefreshActiveNote();
        }
    };

    /** 启动轮询 */
    const startPolling = () => {
        stopPolling();
        timer = setInterval(() => {
            void silentRefresh();
        }, POLL_INTERVAL);
    };

    /** 停止轮询 */
    const stopPolling = () => {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    };

    /** 处理可见性变化 */
    const handleVisibilityChange = () => {
        if (document.hidden) {
            // 标签页隐藏 → 启动后台轮询
            startPolling();
        } else {
            // 标签页恢复可见 → 停止轮询 + 立即刷新（跳过激活笔记）
            stopPolling();
            void silentRefresh({ skipActiveNote: true });
        }
        isTabVisible.value = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    onBeforeUnmount(() => {
        stopPolling();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    });

    return { isTabVisible };
}
