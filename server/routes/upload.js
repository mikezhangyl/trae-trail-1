import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sessions } from './auth.js';

const router = express.Router();

// 配置Multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const filename = `${timestamp}_${path.basename(originalName, extension)}${extension}`;
    cb(null, filename);
  }
});

// 创建Multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 限制文件大小为15MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，只支持JPEG、PNG和WebP格式'));
    }
  }
});

// 预留的校验/转码函数（暂时返回TODO）
const validateAndProcessImage = async (filePath) => {
  // TODO: 实现图片校验和转码逻辑
  console.log('图片校验和转码功能待实现', filePath);
  return 'TODO';
};

// 验证会话中间件
const authenticateSession = (req, res, next) => {
  const sessionToken = req.headers['x-session-token'];
  
  if (!sessionToken || !sessions.has(sessionToken)) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: '未授权访问'
    });
  }
  
  req.user = sessions.get(sessionToken);
  next();
};

// POST /upload
router.post('/', authenticateSession, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new Error('没有文件上传'));
    }
    
    const file = req.file;
    const tempUrl = `/uploads/${file.filename}`;
    
    // 调用预留的校验/转码函数
    const processResult = await validateAndProcessImage(file.path);
    
    // 更新用户头像URL
    if (req.user) {
      const sessionToken = req.headers['x-session-token'];
      const session = sessions.get(sessionToken);
      if (session) {
        session.avatar = tempUrl;
        sessions.set(sessionToken, session);
      }
    }
    
    // 返回成功响应
    return res.json({
      ok: true,
      tempUrl,
      processResult,
      fileInfo: {
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }
    });
  } catch (error) {
    // 如果上传失败，删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

export default router;