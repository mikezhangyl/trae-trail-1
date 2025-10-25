import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建用户上下文
const UserContext = createContext();

// 用户上下文提供者组件
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 默认头像列表
  const defaultAvatars = [
    '/src/assets/avatars/cartoon1.svg',
    '/src/assets/avatars/cartoon2.svg',
    '/src/assets/avatars/cartoon3.svg'
  ];

  // 初始化时从localStorage加载用户信息
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  // 注册功能
  const register = (username, password, avatar) => {
    // 在实际应用中，这里应该调用后端API
    // 这里简单模拟注册
    const newUser = {
      id: Date.now(),
      username,
      password,
      avatar: avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)]
    };
    
    // 保存到localStorage
    localStorage.setItem('user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    
    return true;
  };

  // 登录功能
  const login = (username, password) => {
    // 在实际应用中，这里应该调用后端API进行验证
    // 这里简单模拟登录验证
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.username === username && user.password === password) {
        setCurrentUser(user);
        return true;
      }
    }
    return false;
  };

  // 注销功能
  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // 更新用户头像
  const updateAvatar = (newAvatarUrl) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, avatar: newAvatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }
  };

  // 提供的上下文值
  const value = {
    currentUser,
    isLoading,
    defaultAvatars,
    register,
    login,
    logout,
    updateAvatar
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// 自定义Hook，方便使用用户上下文
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};