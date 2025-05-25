import React, { useRef, useEffect, useState, useCallback } from 'react';

const SketchVideoComposer = ({ 
  onVideoGenerated, 
  defaultMonsterName = "Whiskers", 
  defaultAge = 8,
  className = "",
  theme = "default" 
}) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const animationRef = useRef(null);
  
  const [backgroundVideo, setBackgroundVideo] = useState(null);
  const [backgroundTemplate, setBackgroundTemplate] = useState(null);
  const [originalSketch, setOriginalSketch] = useState(null);
  const [monsterName, setMonsterName] = useState(defaultMonsterName);
  const [childAge, setChildAge] = useState(defaultAge);
  const [sketchPosition, setSketchPosition] = useState({ x: 50, y: 560 });
  const [sketchSize, setSketchSize] = useState({ width: 135, height: 240 });
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [textPosition, setTextPosition] = useState({ x: 220, y: 680 });
  const [videoPosition, setVideoPosition] = useState({ x: 60, y: 120 });
  const [videoSize, setVideoSize] = useState({ width: 285, height: 428 });
  const [recordDuration, setRecordDuration] = useState(5);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [status, setStatus] = useState({ message: '', type: '', visible: false });
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Canvas dimensions (9:16 ratio)
  const CANVAS_WIDTH = 405;
  const CANVAS_HEIGHT = 720;

  const showStatus = useCallback((message, type = 'info') => {
    setStatus({ message, type, visible: true });
    setTimeout(() => {
      setStatus(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const handleSizeChange = useCallback((dimension, value) => {
    if (!maintainAspectRatio) {
      setSketchSize(prev => ({ ...prev, [dimension]: value }));
      return;
    }
    
    const aspectRatio = 9 / 16; // width / height
    
    if (dimension === 'width') {
      const newHeight = Math.round(value / aspectRatio);
      setSketchSize({ width: value, height: Math.min(Math.max(newHeight, 89), 356) });
    } else if (dimension === 'height') {
      const newWidth = Math.round(value * aspectRatio);
      setSketchSize({ width: Math.min(Math.max(newWidth, 50), 200), height: value });
    }
  }, [maintainAspectRatio]);

  const updateAspectRatioConstraints = useCallback(() => {
    if (maintainAspectRatio) {
      // Adjust height to match current width
      handleSizeChange('width', sketchSize.width);
    }
  }, [maintainAspectRatio, sketchSize.width, handleSizeChange]);

  useEffect(() => {
    updateAspectRatioConstraints();
  }, [maintainAspectRatio]);

  const drawBackground = useCallback((ctx) => {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw background template if available
    if (backgroundTemplate) {
      ctx.drawImage(backgroundTemplate, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw video in center frame area (adjust these values based on your template)
      if (backgroundVideo && videoRef.current && !videoRef.current.paused) {
        // Get dynamic video frame dimensions from state
        const videoFrameX = videoPosition.x;
        const videoFrameY = videoPosition.y;
        const videoFrameWidth = videoSize.width;
        const videoFrameHeight = videoSize.height;
        const cornerRadius = 20; // Rounded corners
        
        // Create clipping path for rounded rectangle
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(videoFrameX, videoFrameY, videoFrameWidth, videoFrameHeight, cornerRadius);
        } else {
          ctx.rect(videoFrameX, videoFrameY, videoFrameWidth, videoFrameHeight);
        }
        ctx.clip();
        
        // Draw the video within the frame
        ctx.drawImage(videoRef.current, videoFrameX, videoFrameY, videoFrameWidth, videoFrameHeight);
        
        ctx.restore();
      }
    } else {
      // Fallback: draw video or gradient background (original behavior)
      if (backgroundVideo && videoRef.current && !videoRef.current.paused) {
        ctx.drawImage(videoRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        // Default gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Placeholder text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Upload Monster Video', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }
    }
  }, [backgroundVideo, backgroundTemplate, videoPosition, videoSize]);

  const drawImageFit = useCallback((ctx, img, x, y, width, height) => {
    // Calculate scaling to fit image within bounds while maintaining aspect ratio
    const imgAspect = img.width / img.height;
    const targetAspect = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > targetAspect) {
      // Image is wider than target - fit to width
      drawWidth = width;
      drawHeight = width / imgAspect;
      drawX = x;
      drawY = y + (height - drawHeight) / 2;
    } else {
      // Image is taller than target - fit to height
      drawHeight = height;
      drawWidth = height * imgAspect;
      drawX = x + (width - drawWidth) / 2;
      drawY = y;
    }
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }, []);

  const drawSketch = useCallback((ctx) => {
    if (!originalSketch) return;
    
    const { x, y } = sketchPosition;
    const { width, height } = sketchSize;
    const radius = 8;
    
    // Draw sketch with rounded corners and border
    ctx.save();
    
    // Create rounded rectangle path
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      // Fallback for browsers without roundRect
      ctx.rect(x, y, width, height);
    }
    ctx.clip();
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, width, height);
    
    // Draw the sketch image (maintain aspect ratio)
    drawImageFit(ctx, originalSketch, x, y, width, height);
    
    ctx.restore();
    
    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.stroke();
    
    // Add shadow effect
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.stroke();
    ctx.restore();
  }, [originalSketch, sketchPosition, sketchSize, drawImageFit]);

  const drawText = useCallback((ctx) => {
    // Configure text styling
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Draw monster name (large)
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.strokeText(monsterName, textPosition.x, textPosition.y - 30);
    ctx.fillText(monsterName, textPosition.x, textPosition.y - 30);
    
    // Draw age (smaller, below name)
    ctx.font = 'bold 20px Arial, sans-serif';
    const ageText = `Age: ${childAge}`;
    ctx.strokeText(ageText, textPosition.x, textPosition.y);
    ctx.fillText(ageText, textPosition.x, textPosition.y);
  }, [monsterName, childAge, textPosition]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawBackground(ctx);
    drawSketch(ctx);
    drawText(ctx);
  }, [drawBackground, drawSketch, drawText]);

  const animate = useCallback(() => {
    redraw();
    animationRef.current = requestAnimationFrame(animate);
  }, [redraw]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleVideoLoad = (file) => {
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const video = videoRef.current;
    video.src = url;
    video.load();
    
    video.addEventListener('loadeddata', () => {
      setBackgroundVideo(video);
      video.play();
      showStatus('Background video loaded successfully!', 'success');
    });
    
    video.addEventListener('error', () => {
      showStatus('Error loading background video', 'error');
    });
  };

  const handleTemplateLoad = (file) => {
    if (!file) return;
    
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      setBackgroundTemplate(img);
      showStatus('Background template loaded successfully!', 'success');
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      showStatus('Error loading background template', 'error');
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const handleSketchLoad = (file) => {
    if (!file) return;
    
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      setOriginalSketch(img);
      showStatus('Original sketch loaded successfully!', 'success');
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      showStatus('Error loading sketch image', 'error');
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const startRecording = async () => {
    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30); // 30 FPS
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setRecordedChunks(chunks);
        
        if (onVideoGenerated) {
          onVideoGenerated(blob, url);
        }
        
        showStatus('Video ready for download!', 'success');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      showStatus('Recording started...', 'info');
      
      // Auto-stop after specified duration
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      }, recordDuration * 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      showStatus('Error starting recording', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showStatus('Recording completed!', 'success');
    }
  };

  const downloadVideo = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `sketch-monster-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showStatus('Video downloaded successfully!', 'success');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`sketch-video-composer ${className}`}>
      <style jsx>{`
        .sketch-video-composer {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
          text-align: center;
        }
        
        .content {
          padding: 30px;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 30px;
        }
        
        .preview-section {
          position: relative;
        }
        
        .canvas-container {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        
        .canvas-container canvas {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .controls {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }
        
        .control-group {
          margin-bottom: 20px;
        }
        
        .control-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        
        .file-input-wrapper {
          position: relative;
          display: inline-block;
          width: 100%;
        }
        
        .file-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        .file-input-button {
          display: block;
          width: 100%;
          padding: 12px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: background 0.2s;
        }
        
        .file-input-button:hover {
          background: #0056b3;
        }
        
        input[type="text"], input[type="number"], input[type="range"] {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        input[type="text"]:focus, input[type="number"]:focus {
          outline: none;
          border-color: #007bff;
        }
        
        .range-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .range-value {
          min-width: 40px;
          text-align: center;
          font-weight: 600;
          color: #666;
        }
        
        .position-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .size-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .checkbox-container {
          margin-top: 10px;
        }
        
        .checkbox-container label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: normal;
          cursor: pointer;
        }
        
        .checkbox-container input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        
        .download-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          display: inline-block;
          text-decoration: none;
          margin-right: 10px;
        }
        
        .btn-primary {
          background: #28a745;
          color: white;
        }
        
        .btn-primary:hover {
          background: #218838;
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #545b62;
        }
        
        .status {
          margin-top: 15px;
          padding: 10px;
          border-radius: 6px;
          font-size: 14px;
          text-align: center;
          transition: opacity 0.3s;
        }
        
        .status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .status.info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        
        .hidden {
          opacity: 0;
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          .content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <div className="header">
        <h1>🎨 Sketch Video Composer</h1>
        <p>Bring your sketches to life with AI-generated animations</p>
      </div>
      
      <div className="content">
        <div className="preview-section">
          <div className="canvas-container">
            <canvas 
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />
            <video 
              ref={videoRef}
              style={{ display: 'none' }}
              loop
              muted
            />
          </div>
          
          <div className="download-section">
            <button 
              onClick={toggleRecording}
              className={`btn ${isRecording ? 'btn-primary' : 'btn-secondary'}`}
            >
              {isRecording ? '⏹️ Stop Recording' : '🎥 Start Recording'}
            </button>
            
            {downloadUrl && (
              <button 
                onClick={downloadVideo}
                className="btn btn-primary"
              >
                📥 Download Video
              </button>
            )}
            
            <div className={`status ${status.type} ${!status.visible ? 'hidden' : ''}`}>
              {status.message}
            </div>
          </div>
        </div>
        
        <div className="controls">
          <div className="control-group">
            <label>Background Video (AI Monster)</label>
            <div className="file-input-wrapper">
              <input 
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoLoad(e.target.files[0])}
                className="file-input"
              />
              <div className="file-input-button">Choose Monster Video</div>
            </div>
          </div>
          
          <div className="control-group">
            <label>Background Template</label>
            <div className="file-input-wrapper">
              <input 
                type="file"
                accept="image/*"
                onChange={(e) => handleTemplateLoad(e.target.files[0])}
                className="file-input"
              />
              <div className="file-input-button">Upload Background Template</div>
            </div>
          </div>
          
          <div className="control-group">
            <label>Original Sketch</label>
            <div className="file-input-wrapper">
              <input 
                type="file"
                accept="image/*"
                onChange={(e) => handleSketchLoad(e.target.files[0])}
                className="file-input"
              />
              <div className="file-input-button">Upload Original Sketch</div>
            </div>
          </div>
          
          <div className="control-group">
            <label>Monster Name</label>
            <input 
              type="text"
              value={monsterName}
              onChange={(e) => setMonsterName(e.target.value)}
              placeholder="Enter monster name..."
            />
          </div>
          
          <div className="control-group">
            <label>Child's Age</label>
            <input 
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(parseInt(e.target.value) || 0)}
              min="1"
              max="18"
            />
          </div>
          
          <div className="control-group">
            <label>Sketch Position</label>
            <div className="position-controls">
              <div>
                <label>X Position</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="0"
                    max="250"
                    value={sketchPosition.x}
                    onChange={(e) => setSketchPosition(prev => ({
                      ...prev,
                      x: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{sketchPosition.x}</span>
                </div>
              </div>
              <div>
                <label>Y Position</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="0"
                    max="500"
                    value={sketchPosition.y}
                    onChange={(e) => setSketchPosition(prev => ({
                      ...prev,
                      y: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{sketchPosition.y}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="control-group">
            <label>Sketch Size (9:16 Aspect Ratio)</label>
            <div className="size-controls">
              <div>
                <label>Width</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="50"
                    max="200"
                    value={sketchSize.width}
                    onChange={(e) => handleSizeChange('width', parseInt(e.target.value))}
                  />
                  <span className="range-value">{sketchSize.width}</span>
                </div>
              </div>
              <div>
                <label>Height</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="89"
                    max="356"
                    value={sketchSize.height}
                    onChange={(e) => handleSizeChange('height', parseInt(e.target.value))}
                  />
                  <span className="range-value">{sketchSize.height}</span>
                </div>
              </div>
            </div>
            <div className="checkbox-container">
              <label>
                <input 
                  type="checkbox"
                  checked={maintainAspectRatio}
                  onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                />
                Maintain 9:16 aspect ratio
              </label>
            </div>
          </div>
          
          <div className="control-group">
            <label>Recording Duration (seconds)</label>
            <div className="range-container">
              <input 
                type="range"
                min="3"
                max="15"
                value={recordDuration}
                onChange={(e) => setRecordDuration(parseInt(e.target.value))}
              />
              <span className="range-value">{recordDuration}</span>
            </div>
          </div>
          
          <div className="control-group">
            <label>Text Position</label>
            <div className="position-controls">
              <div>
                <label>Text X Position</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="0"
                    max="350"
                    value={textPosition.x}
                    onChange={(e) => setTextPosition(prev => ({
                      ...prev,
                      x: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{textPosition.x}</span>
                </div>
              </div>
              <div>
                <label>Text Y Position</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="100"
                    max="650"
                    value={textPosition.y}
                    onChange={(e) => setTextPosition(prev => ({
                      ...prev,
                      y: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{textPosition.y}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="control-group">
            <label>Video Frame Position</label>
            <div className="position-controls">
              <div>
                <label>Video X Position</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="0"
                    max="200"
                    value={videoPosition.x}
                    onChange={(e) => setVideoPosition(prev => ({
                      ...prev,
                      x: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{videoPosition.x}</span>
                </div>
              </div>
              <div>
                <label>Video Y Position</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="50"
                    max="300"
                    value={videoPosition.y}
                    onChange={(e) => setVideoPosition(prev => ({
                      ...prev,
                      y: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{videoPosition.y}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="control-group">
            <label>Video Frame Size</label>
            <div className="size-controls">
              <div>
                <label>Video Width</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="200"
                    max="350"
                    value={videoSize.width}
                    onChange={(e) => setVideoSize(prev => ({
                      ...prev,
                      width: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{videoSize.width}</span>
                </div>
              </div>
              <div>
                <label>Video Height</label>
                <div className="range-container">
                  <input 
                    type="range"
                    min="300"
                    max="500"
                    value={videoSize.height}
                    onChange={(e) => setVideoSize(prev => ({
                      ...prev,
                      height: parseInt(e.target.value)
                    }))}
                  />
                  <span className="range-value">{videoSize.height}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SketchVideoComposer; 