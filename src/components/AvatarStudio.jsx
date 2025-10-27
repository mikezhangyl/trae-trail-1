import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AvatarStudio.css';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_COMPRESSED_SIZE = 200 * 1024;
const STAGE_SIZE = 420;

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const AvatarStudio = ({ onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const liveRegionRef = useRef(null);

  const [step, setStep] = useState('select');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [baseScale, setBaseScale] = useState(1);
  const [imageFrame, setImageFrame] = useState({ width: 0, height: 0 });
  const [cropData, setCropData] = useState({ x: 0, y: 0, scale: 1 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragAnchor, setDragAnchor] = useState({ x: 0, y: 0 });
  const [compressionQuality, setCompressionQuality] = useState(0.85);
  const [croppedPreview, setCroppedPreview] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const announce = useCallback((message) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const resetFlow = () => {
    setStep('select');
    setImageSrc(null);
    setFileMeta(null);
    setCropData({ x: 0, y: 0, scale: 1 });
    setCroppedPreview(null);
    setCroppedBlob(null);
    setEstimatedSize(0);
    setCompressionQuality(0.85);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const validateImageMagicNumbers = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = new Uint8Array(event.target.result);
        const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
        const isWebP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
          buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
        resolve(isJPEG || isPNG || isWebP);
      };
      reader.onerror = () => reject(new Error('无法读取文件进行验证'));
      reader.readAsArrayBuffer(file.slice(0, 12));
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('原始图片体积超过 15MB，请压缩后再试。');
      return;
    }
    if (!allowedMimeTypes.includes(file.type)) {
      setError('只支持 JPEG / PNG / WebP 格式。');
      return;
    }
    try {
      const isValidMagic = await validateImageMagicNumbers(file);
      if (!isValidMagic) {
        setError('检测到伪装文件，请选择真实的图片。');
        return;
      }
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setFileMeta({
        name: file.name,
        type: file.type,
        size: file.size
      });
      setError('');
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => setIsDraggingFile(false);

  const initializeImageFrame = useCallback(() => {
    const img = imageRef.current;
    const stage = stageRef.current;
    if (!img || !stage) return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const base = STAGE_SIZE / Math.min(naturalWidth, naturalHeight);
    setBaseScale(base);

    const displayWidth = naturalWidth * base;
    const displayHeight = naturalHeight * base;
    setImageFrame({ width: displayWidth, height: displayHeight });

    const initialX = (STAGE_SIZE - displayWidth) / 2;
    const initialY = (STAGE_SIZE - displayHeight) / 2;
    setCropData({ x: initialX, y: initialY, scale: 1 });
  }, []);

  useEffect(() => {
    if (imageSrc) {
      const img = imageRef.current;
      if (img && img.complete) {
        initializeImageFrame();
      } else if (img) {
        img.onload = initializeImageFrame;
      }
    }
  }, [imageSrc, initializeImageFrame]);

  const clampPosition = (value, dimension) => {
    const min = Math.min(0, STAGE_SIZE - dimension);
    const max = 0;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    setIsDraggingImage(true);
    setDragAnchor({
      x: event.clientX - cropData.x,
      y: event.clientY - cropData.y
    });
  };

  const handlePointerMove = useCallback((event) => {
    if (!isDraggingImage) return;
    const displayWidth = imageFrame.width * cropData.scale;
    const displayHeight = imageFrame.height * cropData.scale;
    setCropData((prev) => ({
      ...prev,
      x: clampPosition(event.clientX - dragAnchor.x, displayWidth),
      y: clampPosition(event.clientY - dragAnchor.y, displayHeight)
    }));
  }, [isDraggingImage, dragAnchor, cropData.scale, imageFrame.width, imageFrame.height]);

  const stopDragging = useCallback(() => {
    setIsDraggingImage(false);
  }, []);

  useEffect(() => {
    if (isDraggingImage) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', stopDragging);
      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', stopDragging);
      };
    }
  }, [isDraggingImage, handlePointerMove, stopDragging]);

  const updateCompressionPreview = useCallback((quality) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      setCroppedBlob(blob);
      setEstimatedSize(blob.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppedPreview(reader.result);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', quality);
  }, []);

  const handleCrop = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const displayWidth = imageFrame.width * cropData.scale;
    const displayHeight = imageFrame.height * cropData.scale;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const visibleWidth = STAGE_SIZE / (baseScale * cropData.scale);
    const visibleHeight = STAGE_SIZE / (baseScale * cropData.scale);

    const offsetX = Math.max(0, Math.min(naturalWidth - visibleWidth, (-cropData.x) / (baseScale * cropData.scale)));
    const offsetY = Math.max(0, Math.min(naturalHeight - visibleHeight, (-cropData.y) / (baseScale * cropData.scale)));

    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      visibleWidth,
      visibleHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    setStep('preview');
    setError('');
    updateCompressionPreview(compressionQuality);
  };

  const handleZoomChange = (event) => {
    const value = parseFloat(event.target.value);
    setCropData((prev) => {
      const displayWidth = imageFrame.width * value;
      const displayHeight = imageFrame.height * value;
      return {
        ...prev,
        scale: value,
        x: clampPosition(prev.x, displayWidth),
        y: clampPosition(prev.y, displayHeight)
      };
    });
  };

  const handleCompressionChange = (event) => {
    const value = parseFloat(event.target.value);
    setCompressionQuality(value);
    if (step === 'preview') {
      updateCompressionPreview(value);
    }
  };

  const handleUpload = async () => {
    if (!croppedBlob) {
      setError('请先完成裁剪。');
      return;
    }
    if (estimatedSize > MAX_COMPRESSED_SIZE) {
      setError('压缩结果超过 200KB，请降低压缩质量。');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('avatar', croppedBlob, 'avatar.jpg');

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload');
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('上传失败'));
          }
        };
        xhr.onerror = () => reject(new Error('网络异常，请稍后重试。'));
        xhr.send(formData);
      });

      setIsUploading(false);
      setSuccess('头像上传成功，资料卡已更新。');
      announce('头像上传成功');
      if (croppedPreview && onUploadSuccess) {
        onUploadSuccess(croppedPreview);
      }
      setTimeout(() => setSuccess(''), 3000);
      resetFlow();
    } catch (uploadError) {
      setIsUploading(false);
      setError(uploadError.message || '上传失败，请重试');
      announce('头像上传失败');
    }
  };

  const handleRetry = () => {
    if (!isUploading) {
      handleUpload();
    }
  };

  const handleBackToCrop = () => {
    setStep('crop');
    setError('');
  };

  const handleKeyActivateDropzone = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const renderSelectStep = () => (
    <section className="studio-card">
      <header className="studio-card__header">
        <span className="eyebrow">步骤 1</span>
        <h2>上传原创头像素材</h2>
        <p className="card-subtitle">支持拖放或点击选择，最大 15MB，JPEG/PNG/WebP</p>
      </header>
      <div
        className={`dropzone ${isDraggingFile ? 'dropzone--active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="上传头像文件，按 Enter 选择"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleKeyActivateDropzone}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="dropzone__icon">⇪</p>
        <p className="dropzone__primary">拖拽图片到此处</p>
        <p className="dropzone__secondary">或点击选择本地文件</p>
        <button
          className="ghost-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          选择文件
        </button>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={fileInputRef}
          className="sr-only"
          onChange={handleFileInputChange}
        />
      </div>
    </section>
  );

  const renderCropStep = () => (
    <section className="studio-card">
      <header className="studio-card__header">
        <span className="eyebrow">步骤 2</span>
        <h2>对齐并裁剪头像</h2>
        <p className="card-subtitle">拖动图片定位面部，使用滑杆处理缩放</p>
      </header>
      <div
        className="crop-stage"
        ref={stageRef}
      >
        <div className="crop-stage__mask" />
        <div
          className="crop-stage__image"
          style={{
            width: `${imageFrame.width}px`,
            height: `${imageFrame.height}px`,
            transform: `translate(${cropData.x}px, ${cropData.y}px) scale(${cropData.scale})`
          }}
          onMouseDown={handlePointerDown}
        >
          <img ref={imageRef} src={imageSrc} alt="待裁剪的头像" draggable={false} />
        </div>
      </div>
      <div className="control-group">
        <label htmlFor="zoom-slider">
          缩放 ({(cropData.scale * 100).toFixed(0)}%)
        </label>
        <input
          id="zoom-slider"
          type="range"
          min="0.6"
          max="3"
          step="0.05"
          value={cropData.scale}
          onChange={handleZoomChange}
        />
      </div>
      <div className="action-row">
        <button type="button" className="ghost-button" onClick={resetFlow}>重新选择</button>
        <button type="button" className="primary-button" onClick={handleCrop}>生成预览</button>
      </div>
    </section>
  );

  const renderPreviewStep = () => (
    <section className="studio-card">
      <header className="studio-card__header">
        <span className="eyebrow">步骤 3</span>
        <h2>压缩与上传</h2>
        <p className="card-subtitle">确认预览、优化体积并提交</p>
      </header>
      <div className="preview-grid">
        <div className="preview-grid__main">
          <div className="preview-frame">
            <img src={croppedPreview} alt="裁剪后的头像预览" />
          </div>
          <div className="preview-meta">
            <div>
              <span className="meta-label">文件名</span>
              <span>{fileMeta?.name || 'avatar.jpg'}</span>
            </div>
            <div>
              <span className="meta-label">格式</span>
              <span>JPEG</span>
            </div>
            <div>
              <span className="meta-label">体积</span>
              <span>{(estimatedSize / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>
        <div className="preview-grid__side">
          <div className="thumb-preview">
            <img src={croppedPreview} alt="圆形头像缩略图" />
          </div>
          <label htmlFor="quality-slider" className="control-group">
            压缩质量 ({Math.round(compressionQuality * 100)}%)
            <input
              id="quality-slider"
              type="range"
              min="0.4"
              max="1"
              step="0.05"
              value={compressionQuality}
              onChange={handleCompressionChange}
            />
          </label>
          {estimatedSize > MAX_COMPRESSED_SIZE && (
            <p className="warning-text">超过 200KB 限制，请降低质量。</p>
          )}
        </div>
      </div>
      {isUploading && (
        <div className="progress">
          <div className="progress__bar">
            <span style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className="progress__label">{uploadProgress}%</span>
        </div>
      )}
      <div className="action-row">
        <button type="button" className="ghost-button" onClick={handleBackToCrop}>返回裁剪</button>
        <button
          type="button"
          className="primary-button"
          onClick={handleUpload}
          disabled={isUploading || estimatedSize > MAX_COMPRESSED_SIZE}
        >
          {isUploading ? '上传中…' : '上传头像'}
        </button>
        {!isUploading && error && (
          <button type="button" className="ghost-button" onClick={handleRetry}>重试上传</button>
        )}
      </div>
    </section>
  );

  return (
    <div className="avatar-studio">
      <div className="sr-only" role="status" aria-live="polite" ref={liveRegionRef} />
      {error && (
        <div className="alert alert--error" aria-live="assertive">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert--success" aria-live="polite">
          <span>{success}</span>
        </div>
      )}
      {step === 'select' && renderSelectStep()}
      {step === 'crop' && renderCropStep()}
      {step === 'preview' && renderPreviewStep()}
      <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
    </div>
  );
};

export default AvatarStudio;
