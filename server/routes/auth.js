import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 模拟用户数据（实际应用中应该使用数据库）
const mockUser = {
  id: '1',
  username: 'admin',
  password: 'password', // 实际应用中应该存储哈希后的密码
  avatar: '/uploads/default-avatar.png'
};

// 模拟会话存储
export const sessions = new Map();

// POST /login
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return next(new Error('用户名和密码不能为空'));
    }
    
    // 验证用户名和密码
    if (username === mockUser.username && password === mockUser.password) {
      // 创建会话令牌
      const sessionToken = uuidv4();
      
      // 存储会话信息
      sessions.set(sessionToken, {
        userId: mockUser.id,
        username: mockUser.username,
        avatar: mockUser.avatar,
        createdAt: Date.now()
      });
      
      // 返回成功响应
      return res.json({
        ok: true,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          avatar: mockUser.avatar
        },
        sessionToken
      });
    } else {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /logout
router.post('/logout', (req, res, next) => {
  try {
    const sessionToken = req.headers['x-session-token'];
    
    if (sessionToken && sessions.has(sessionToken)) {
      sessions.delete(sessionToken);
    }
    
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// GET /me
router.get('/me', (req, res, next) => {
  try {
    const sessionToken = req.headers['x-session-token'];
    
    if (!sessionToken) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '未授权访问'
      });
    }
    
    const session = sessions.get(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        code: 'INVALID_SESSION',
        message: '会话无效或已过期'
      });
    }
    
    // 返回用户信息
    return res.json({
      ok: true,
      user: {
        id: session.userId,
        username: session.username,
        avatar: session.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;