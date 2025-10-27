import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import loggerMiddleware from './middleware/logger.js';
import errorHandlerMiddleware from './middleware/errorHandler.js';

const app = express();
const PORT = 4000;

// 中间件配置
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(loggerMiddleware);

// 根路径
app.get('/', (req, res) => {
  res.json({ message: '服务器运行正常' });
});

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 路由配置
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);

// 错误处理中间件
app.use(errorHandlerMiddleware);

// 启动服务器
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// 导出app供测试使用
export default app;