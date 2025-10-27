/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {boolean} - 是否有效
 */
export const isValidUsername = (username) => {
  if (typeof username !== 'string') return false;
  // 用户名长度3-20个字符，只允许字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {boolean} - 是否有效
 */
export const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;
  // 密码至少6个字符
  return password.length >= 6;
};

/**
 * 验证文件类型是否为图片
 * @param {string} mimetype - 文件MIME类型
 * @returns {boolean} - 是否为有效图片类型
 */
export const isValidImageType = (mimetype) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(mimetype);
};

/**
 * 验证文件大小是否在限制范围内
 * @param {number} size - 文件大小（字节）
 * @param {number} maxSize - 最大允许大小（字节）
 * @returns {boolean} - 是否在限制范围内
 */
export const isValidFileSize = (size, maxSize = 15 * 1024 * 1024) => {
  return size <= maxSize;
};

/**
 * 验证会话令牌格式
 * @param {string} token - 会话令牌
 * @returns {boolean} - 是否有效
 */
export const isValidSessionToken = (token) => {
  if (typeof token !== 'string') return false;
  // UUID v4格式验证
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
};