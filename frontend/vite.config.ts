import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

const buildDate = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 10);

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        // 预编译 locales 目录下的翻译文件，将 {key} 占位符编译为 AST 函数
        // 避免生产构建因 tree-shaking 移除运行时 message compiler 导致变量无法替换
        VueI18nPlugin({
            include: [fileURLToPath(new URL("./src/i18n/locales/**", import.meta.url))],
        }),
    ],
    server: {
        host: "0.0.0.0",
        port: 4000,
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    build: {
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                entryFileNames: `static/assets/index.${buildDate}.js`,
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name && assetInfo.name.endsWith(".css")) {
                        return `static/assets/index.${buildDate}.css`;
                    }
                    return "static/assets/[name]-[hash].[ext]";
                },
                chunkFileNames: "static/assets/[name]-[hash].js",
            },
        },
    },
});
