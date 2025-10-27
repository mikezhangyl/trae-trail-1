import fs from 'fs';
import path from 'path';

/**
 * 检查目录是否存在，如果不存在则创建
 * @param {string} dirPath - 目录路径
 * @returns {Promise<void>}
 */
export const ensureDirectoryExists = async (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
      console.log(`Directory created: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
    throw error;
  }
};

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 是否成功删除
 */
export const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    return false;
  }
};

/**
 * 获取文件信息
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object|null>} - 文件信息
 */
export const getFileInfo = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = await fs.promises.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
        isFile: stats.isFile(),
        extension: path.extname(filePath).toLowerCase()
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting file info: ${error.message}`);
    return null;
  }
};

/**
 * 验证文件魔数，确保是真正的图片文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} - 是否为有效图片
 */
export const validateImageMagicNumbers = async (filePath) => {
  try {
    const fileHandle = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(12);
    await fileHandle.read(buffer, 0, 12, 0);
    await fileHandle.close();
    
    // 检查JPEG魔数
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // 检查PNG魔数
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // 检查WebP魔数
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && 
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error validating image magic numbers: ${error.message}`);
    return false;
  }
};