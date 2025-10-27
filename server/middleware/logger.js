const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, headers } = req;
  
  // 记录请求开始
  console.log(`[${new Date().toISOString()}] ${method} ${url} - Request received`);
  
  // 监听响应完成事件
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const statusCode = res.statusCode;
    
    // 记录响应信息
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} ${duration}ms`);
  });
  
  next();
};

export default loggerMiddleware;