const errorHandlerMiddleware = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // 根据错误类型设置不同的状态码和错误信息
  let statusCode = 500;
  let errorCode = 'SERVER_ERROR';
  let errorMessage = '服务器内部错误';
  
  // 处理特定类型的错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
    errorMessage = '文件大小超过限制';
  } else if (err.message.includes('不支持的文件类型')) {
    statusCode = 400;
    errorCode = 'INVALID_FILE_TYPE';
    errorMessage = err.message;
  } else if (err.message.includes('用户名') || err.message.includes('密码')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = err.message;
  }
  
  // 返回统一格式的错误响应
  res.status(statusCode).json({
    code: errorCode,
    message: errorMessage
  });
};

export default errorHandlerMiddleware;