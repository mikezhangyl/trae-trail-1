import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import AvatarCropper from '../components/AvatarCropper';
import '../App.css';

const UserPage = () => {
  const { currentUser, updateAvatar, logout } = useUser();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // 如果用户未登录，重定向到登录页面
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarUploadSuccess = (avatarUrl) => {
    updateAvatar(avatarUrl);
    setSuccess('头像更新成功！');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="user-container">
      <div className="user-header">
        <h1>用户中心</h1>
        <button className="logout-button" onClick={handleLogout}>退出登录</button>
      </div>
      
      <div className="user-info">
        <div className="avatar-section">
        <div className="avatar-container">
          <img 
            src={currentUser.avatar} 
            alt="用户头像" 
            className="user-avatar"
          />
        </div>
        
        <div className="avatar-upload-section">
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-message">{error}</div>}
          
          <AvatarCropper onUploadSuccess={handleAvatarUploadSuccess} />
        </div>
        </div>
        
        <div className="user-details">
          <h3>账户信息</h3>
          <div className="detail-item">
            <span className="label">用户名：</span>
            <span className="value">{currentUser.username}</span>
          </div>
          <div className="detail-item">
            <span className="label">用户ID：</span>
            <span className="value">{currentUser.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;