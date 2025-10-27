import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [hasError, setHasError] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const lockTimerRef = useRef(null);
  
  // 从localStorage加载失败次数和锁定信息
  useEffect(() => {
    const loadLoginAttempts = () => {
      const attemptsData = localStorage.getItem('loginAttempts');
      if (attemptsData) {
        try {
          const data = JSON.parse(attemptsData);
          const now = Date.now();
          
          // 检查是否仍在锁定时间内
          if (data.lockedUntil && now < data.lockedUntil) {
            setIsLocked(true);
            setLockTimeLeft(Math.ceil((data.lockedUntil - now) / 1000));
            
            // 设置倒计时
            startCountdown(data.lockedUntil);
          }
        } catch (e) {
          console.error('解析登录尝试数据失败:', e);
        }
      }
    };
    
    loadLoginAttempts();
    
    // 清理函数
    return () => {
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
      }
    };
  }, []);
  
  // 倒计时函数
  const startCountdown = (lockedUntil) => {
    if (lockTimerRef.current) {
      clearInterval(lockTimerRef.current);
    }
    
    lockTimerRef.current = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.ceil((lockedUntil - now) / 1000);
      
      if (timeLeft > 0) {
        setLockTimeLeft(timeLeft);
      } else {
        // 锁定时间结束
        setIsLocked(false);
        setLockTimeLeft(0);
        clearInterval(lockTimerRef.current);
        // 清除锁定信息
        const attemptsData = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        localStorage.setItem('loginAttempts', JSON.stringify({ ...attemptsData, attempts: 0, lockedUntil: null }));
      }
    }, 1000);
  };
  
  // 记录失败尝试
  const recordFailedAttempt = () => {
    const attemptsData = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
    const currentUsername = username || 'anonymous';
    
    // 如果更换了用户名，重置该用户名的失败次数
    if (attemptsData.username && attemptsData.username !== currentUsername) {
      attemptsData.attempts = 0;
    }
    
    attemptsData.username = currentUsername;
    attemptsData.attempts = (attemptsData.attempts || 0) + 1;
    
    // 检查是否需要锁定
    if (attemptsData.attempts >= 3) {
      const lockUntil = Date.now() + 30000; // 锁定30秒
      attemptsData.lockedUntil = lockUntil;
      setIsLocked(true);
      setLockTimeLeft(30);
      startCountdown(lockUntil);
    }
    
    localStorage.setItem('loginAttempts', JSON.stringify(attemptsData));
    return attemptsData.attempts;
  };
  
  // 重置失败次数
  const resetFailedAttempts = () => {
    const attemptsData = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
    attemptsData.attempts = 0;
    attemptsData.lockedUntil = null;
    localStorage.setItem('loginAttempts', JSON.stringify(attemptsData));
  };
  
  // 处理用户名变化
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    // 清空错误信息
    if (error) {
      setError('');
      setHasError(false);
    }
  };
  
  // 处理密码变化
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // 清空错误信息
    if (error) {
      setError('');
      setHasError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setHasError(false);
    
    // 检查是否被锁定
    if (isLocked) {
      setError(`请 ${lockTimeLeft} 秒后重试`);
      return;
    }
    
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    
    // 显示加载状态
    setIsLoading(true);
    
    try {
      // 模拟异步登录请求
      const success = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(login(username, password));
        }, 500); // 模拟网络延迟
      });
      
      if (success) {
        // 登录成功，重置失败次数
        resetFailedAttempts();
        navigate('/user');
      } else {
        // 登录失败，记录尝试次数
        const attempts = recordFailedAttempt();
        
        if (isLocked) {
          setError(`连续3次登录失败，请 ${lockTimeLeft} 秒后重试`);
        } else {
          // 显示错误信息并添加抖动动画
          setError('用户名或密码错误');
          setHasError(true);
          
          // 300ms后移除抖动类
          setTimeout(() => {
            setHasError(false);
          }, 300);
        }
      }
    } catch (err) {
      // 处理网络异常或其他错误
      setError('网络异常，请稍后重试');
      setHasError(true);
      
      setTimeout(() => {
        setHasError(false);
      }, 300);
    } finally {
      // 隐藏加载状态
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-form ${hasError ? 'shake' : ''}`} ref={formRef}>
        <h2>登录</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="请输入密码"
              required
            />
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading || isLocked}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : isLocked ? (
              `请 ${lockTimeLeft} 秒后重试`
            ) : (
              '登录'
            )}
          </button>
        </form>
        <p className="register-link">
          还没有账号？ <a href="/register">立即注册</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;