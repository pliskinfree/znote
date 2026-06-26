export const vUsername = (username: string): boolean => {
    return /^[a-z0-9]{3,16}$/.test(username);
};

export const vPassword = (password: string): boolean => {
    return /^[a-zA-Z0-9!@#$%^&*()_+\.]{6,18}$/.test(password);
};

export const vEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/** slug 校验：仅允许小写字母、数字、连字符，不能以连字符开头/结尾，长度 1-64 */
export const vSlug = (slug: string): boolean => {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 1 && slug.length <= 64;
};
