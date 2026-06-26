/**
 * 文件上传工具函数
 */

/** 从原始文件名提取扩展名（不含点），如 "photo.jpg" → "jpg" */
export function getExtFromName(name: string): string {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** 根据 MIME 类型推导文件扩展名（降级策略） */
export function getExtFromMime(mime: string): string {
    const map: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
        "image/bmp": "bmp",
    };
    return map[mime] || "bin";
}

/** 允许上传的图片 MIME 类型白名单 */
export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
];

/** 单文件大小上限：10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 文件存储根目录 */
export const FILES_BASE_PATH = "./data/files";
