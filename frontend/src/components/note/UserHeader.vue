<script setup lang="ts">
/**
 * 第一栏顶部：用户信息卡片
 *
 * 功能：
 * 1. 展示头像和昵称（无头像回退为首字母）
 * 2. 下拉菜单：个人中心、返回后台、退出登录
 * 3. 通过事件与父组件通信，路由跳转由 NoteView 统一处理
 */
import { computed, h } from "vue";
import { NDropdown } from "naive-ui";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/stores/user";
import ZIcon from "@/components/DynamicIcon.vue";

const { t } = useI18n();
const userStore = useUserStore();

const emit = defineEmits<{
    (e: "navigate", path: string): void;
}>();

/** 用户名首字母（用于无头像时的回退） */
const initial = computed(() => {
    const name = userStore.userInfo.username || "";
    return name.charAt(0).toUpperCase() || "U";
});

/** 下拉菜单配置 */
const userMenuOptions = computed(() => [
    {
        label: t("note.user.back_dashboard"),
        key: "dashboard",
        icon: () => h(ZIcon, { name: "ri:dashboard-line", size: 16 }),
    },
    {
        label: t("note.user.profile"),
        key: "profile",
        icon: () => h(ZIcon, { name: "ri:user-settings-line", size: 16 }),
    },
    { type: "divider", key: "d1" },
    {
        label: t("note.user.logout"),
        key: "logout",
        icon: () => h(ZIcon, { name: "ri:logout-box-line", size: 16 }),
    },
]);

/** 处理下拉菜单选择 */
const handleMenuSelect = (key: string) => {
    if (key === "dashboard") {
        emit("navigate", "/dashboard/home");
        return;
    }
    if (key === "profile") {
        emit("navigate", "/dashboard/profile");
        return;
    }
    if (key === "logout") {
        void userStore.logout();
    }
};
</script>

<template>
  <!-- 用户信息卡片：头像 + 昵称 + 下拉 -->
  <NDropdown :options="userMenuOptions" trigger="click" @select="handleMenuSelect">
    <div
      class="group flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200/60 bg-white px-3 py-2.5 transition hover:border-slate-300 hover:shadow-sm"
    >
      <!-- 头像（无图时回退为首字母） -->
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white"
      >
        <img v-if="userStore.userInfo.avatar" :src="userStore.userInfo.avatar" class="h-full w-full object-cover" alt="avatar" />
        <span v-else>{{ initial }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-medium text-slate-700">
          {{ userStore.userInfo.username || t("dashboard.user.fallback") }}
        </div>
        <div class="truncate text-xs text-slate-400">
          {{ userStore.userInfo.email || "" }}
        </div>
      </div>
      <ZIcon name="ri:arrow-down-s-line" :size="16" color="#94a3b8" />
    </div>
  </NDropdown>
</template>
