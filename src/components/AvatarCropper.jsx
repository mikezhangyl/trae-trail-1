import React, { useState, useRef, useEffect } from 'react';
import './AvatarCropper.css';

const AvatarCropper = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    scale: 1,
    aspect: 1
  });
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('select'); // select, crop, preview
  const [croppedImage, setCroppedImage] = useState(null);
  const [originalCropData, setOriginalCropData] = useState(null);
  
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // 文件魔数校验
  const validateImageMagicNumbers = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result).subarray(0, 12);
        let isValid = false;
        
        // 检查JPEG魔数
        if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
          isValid = true;
        }
        // 检查PNG魔数
        else if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
          isValid = true;
        }
        // 检查WebP魔数
        else if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 && 
                 arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50) {
          isValid = true;
        }
        
        resolve(isValid);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file.slice(0, 12));
    });
  };
  
  // 处理文件选择
  const handleFileSelect = async (file) => {
    // 检查文件大小
    if (file.size > 15 * 1024 * 1024) {
      setError('文件大小不能超过15MB');
      return;
    }
    
    // 检查文件类型
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('请上传JPEG、PNG或WebP格式的图片');
      return;
    }
    
    // 魔数校验
    try {
      const isValidMagic = await validateImageMagicNumbers(file);
      if (!isValidMagic) {
        setError('文件格式验证失败，请上传有效的图片文件');
        return;
      }
    } catch (err) {
      setError('文件验证失败');
      return;
    }
    
    setError('');
    setSelectedFile(file);
    
    // 创建预览URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };
  
  // 处理拖拽事件
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  // 计算裁剪参数
  useEffect(() => {
    if (imageRef.current && step === 'crop') {
      const img = imageRef.current;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const cropSize = Math.min(containerWidth, containerHeight) * 0.8;
      
      // 计算初始缩放和位置，使图片居中且完全显示
      const imgRatio = img.naturalWidth / img.naturalHeight;
      let scale, offsetX, offsetY;
      
      if (imgRatio >= 1) {
        // 图片更宽
        scale = cropSize / img.naturalHeight;
        offsetX = (img.naturalWidth * scale - cropSize) / 2;
        offsetY = 0;
      } else {
        // 图片更高
        scale = cropSize / img.naturalWidth;
        offsetX = 0;
        offsetY = (img.naturalHeight * scale - cropSize) / 2;
      }
      
      const newCropData = {
        x: -offsetX,
        y: -offsetY,
        scale,
        aspect: 1
      };
      
      setCropData(newCropData);
      setOriginalCropData(newCropData);
    }
  }, [imageSrc, step]);
  
  // 拖拽移动图片
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const handleMouseDown = (e) => {
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX - cropData.x, y: e.clientY - cropData.y });
  };
  
  const handleMouseMove = (e) => {
    if (!isDraggingImage) return;
    
    setCropData(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };
  
  const handleMouseUp = () => {
    setIsDraggingImage(false);
  };
  
  useEffect(() => {
    if (isDraggingImage) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingImage, dragStart]);
  
  // 缩放功能
  const handleZoom = (delta) => {
    setCropData(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale + delta * 0.1)
    }));
  };
  
  // 计算估计文件大小
  useEffect(() => {
    if (croppedImage) {
      const sizeInBytes = Math.round(croppedImage.length * 0.75); // Base64转换为字节的粗略估计
      setEstimatedSize(sizeInBytes);
    }
  }, [croppedImage, compressionQuality]);
  
  // 裁剪图片
  const handleCrop = () => {
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const size = 500; // 固定500x500的裁剪尺寸
    
    canvas.width = size;
    canvas.height = size;
    
    const container = containerRef.current;
    const containerSize = Math.min(container.clientWidth, container.clientHeight) * 0.8;
    const scaleRatio = size / containerSize;
    
    const drawX = (-cropData.x * scaleRatio);
    const drawY = (-cropData.y * scaleRatio);
    const drawWidth = img.naturalWidth * cropData.scale * scaleRatio;
    const drawHeight = img.naturalHeight * cropData.scale * scaleRatio;
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    // 生成压缩后的图片
    const compressedDataUrl = canvas.toDataURL('image/jpeg', compressionQuality);
    setCroppedImage(compressedDataUrl);
    setStep('preview');
  };
  
  // 重试上传
  const handleRetryUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setError('');
  };
  
  // 上传图片
  const handleUpload = async () => {
    if (!croppedImage) return;
    
    // 检查文件大小
    const sizeInBytes = Math.round(croppedImage.length * 0.75);
    if (sizeInBytes > 200 * 1024) {
      setError('压缩后的文件大小超过200KB，请降低压缩质量重试');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      // 将DataURL转换为Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');
      
      // 使用XMLHttpRequest以获取上传进度
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setSuccess('头像上传成功！');
          if (onUploadSuccess) {
            onUploadSuccess(croppedImage);
          }
          setTimeout(() => setSuccess(''), 3000);
          setStep('select');
          setSelectedFile(null);
          setImageSrc(null);
          setCroppedImage(null);
        } else {
          setError('上传失败，请重试');
        }
      });
      
      xhr.addEventListener('error', () => {
        setIsUploading(false);
        setError('上传失败，请重试');
      });
      
      xhr.open('POST', '/upload');
      xhr.send(formData);
    } catch (err) {
      setIsUploading(false);
      setError('上传失败，请重试');
    }
  };
  
  // 重新选择图片
  const handleReselect = () => {
    setStep('select');
    setSelectedFile(null);
    setImageSrc(null);
    setCroppedImage(null);
    setError('');
  };
  
  // 返回裁剪步骤
  const handleBackToCrop = () => {
    setStep('crop');
  };
  
  // 渲染选择文件界面
  const renderSelectStep = () => (
    <div 
      className={`avatar-cropper-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('avatar-file-input').click()}
    >
      <input
        id="avatar-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="file-input"
      />
      <div className="upload-prompt">
        <div className="upload-icon">+</div>
        <p>点击或拖拽图片到此处上传</p>
        <p className="upload-hint">支持 JPEG、PNG、WebP 格式，最大 15MB</p>
      </div>
    </div>
  );
  
  // 渲染裁剪界面
  const renderCropStep = () => (
    <div className="crop-container" ref={containerRef}>
      <div className="crop-controls">
        <button className="control-btn" onClick={handleReselect}>重新选择</button>
        <button className="control-btn zoom-in" onClick={() => handleZoom(1)}>放大</button>
        <button className="control-btn zoom-out" onClick={() => handleZoom(-1)}>缩小</button>
        <button className="control-btn primary" onClick={handleCrop}>裁剪完成</button>
      </div>
      
      <div className="crop-stage" onMouseDown={handleMouseDown}>
        <div 
          className="crop-image-container"
          style={{
            transform: `translate(${cropData.x}px, ${cropData.y}px) scale(${cropData.scale})`
          }}
        >
          <img 
            ref={imageRef} 
            src={imageSrc} 
            alt="裁剪预览" 
            className="crop-image"
          />
        </div>
        <div className="crop-overlay">
          <div className="crop-circle"></div>
        </div>
      </div>
    </div>
  );
  
  // 渲染预览界面
  const renderPreviewStep = () => (
    <div className="preview-container">
      <div className="preview-content">
        <div className="avatar-preview-circle">
          <img src={croppedImage} alt="头像预览" className="avatar-preview" />
        </div>
        
        <div className="compression-controls">
          <label>
            压缩质量: {Math.round(compressionQuality * 100)}%
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={compressionQuality}
              onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
              className="quality-slider"
            />
          </label>
          <p className="estimated-size">
            预计文件大小: {Math.round(estimatedSize / 1024)} KB
            {estimatedSize > 200 * 1024 && (
              <span className="size-warning"> (超过200KB限制)</span>
            )}
          </p>
        </div>
        
        <div className="preview-controls">
          <button className="control-btn" onClick={handleBackToCrop}>重新裁剪</button>
          <button 
            className="control-btn primary" 
            onClick={handleUpload}
            disabled={isUploading || estimatedSize > 200 * 1024}
          >
            {isUploading ? '上传中...' : '上传头像'}
          </button>
        </div>
        
        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="avatar-cropper-wrapper">
      {error && (
        <div className="error-message">
          {error}
          {(step === 'preview' || isUploading) && (
            <button className="retry-btn" onClick={handleRetryUpload}>重试</button>
          )}
        </div>
      )}
      {success && <div className="success-message">{success}</div>}
      
      {step === 'select' && renderSelectStep()}
      {step === 'crop' && renderCropStep()}
      {step === 'preview' && renderPreviewStep()}
      
      <canvas ref={cropCanvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default AvatarCropper;