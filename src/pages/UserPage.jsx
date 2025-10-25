import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const UserPage = () => {
  const { currentUser, updateAvatar, logout } = useUser();
  const [avatarPreview, setAvatarPreview] = useState(null);
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件类型
      if (!file.type.match('image.*')) {
        setError('请上传图片文件');
        return;
      }

      // 创建预览URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSubmit = () => {
    if (avatarPreview) {
      updateAvatar(avatarPreview);
      setSuccess('头像更新成功！');
      setAvatarPreview(null);
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    }
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
            
            <div className="upload-controls">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-input"
              />
              <button 
                onClick={handleAvatarSubmit} 
                disabled={!avatarPreview}
                className="upload-button"
              >
                更新头像
              </button>
            </div>
            
            {avatarPreview && (
              <div className="avatar-preview">
                <h4>预览</h4>
                <img 
                  src={avatarPreview} 
                  alt="头像预览" 
                  className="preview-image"
                />
              </div>
            )}
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