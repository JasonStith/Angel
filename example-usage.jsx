import React, { useState } from 'react';
import SketchVideoComposer from './SketchVideoComposer';

const ExampleApp = () => {
  const [generatedVideos, setGeneratedVideos] = useState([]);

  const handleVideoGenerated = (videoBlob, videoUrl) => {
    console.log('Video generated!', { videoBlob, videoUrl });
    
    // Add to our collection
    const newVideo = {
      id: Date.now(),
      blob: videoBlob,
      url: videoUrl,
      timestamp: new Date().toISOString(),
      size: videoBlob.size
    };
    
    setGeneratedVideos(prev => [newVideo, ...prev]);
    
    // You could also upload to your server here
    // uploadVideoToServer(videoBlob);
  };

  const uploadVideoToServer = async (videoBlob) => {
    const formData = new FormData();
    formData.append('video', videoBlob, `sketch-video-${Date.now()}.webm`);
    
    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Video uploaded successfully:', result);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  const shareVideo = async (video) => {
    if (navigator.share && navigator.canShare({ files: [new File([video.blob], 'sketch-video.webm')] })) {
      try {
        await navigator.share({
          title: 'My Sketch Video',
          text: 'Check out this cool sketch animation!',
          files: [new File([video.blob], 'sketch-video.webm', { type: 'video/webm' })]
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(video.url);
      alert('Video URL copied to clipboard!');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <SketchVideoComposer 
        onVideoGenerated={handleVideoGenerated}
        defaultMonsterName="Friendly Dragon"
        defaultAge={7}
        className="my-custom-composer"
      />
      
      {generatedVideos.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2>Generated Videos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {generatedVideos.map(video => (
              <div key={video.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                background: 'white'
              }}>
                <video 
                  src={video.url} 
                  controls 
                  style={{ width: '100%', borderRadius: '4px' }}
                />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  <div>Size: {(video.size / 1024 / 1024).toFixed(2)} MB</div>
                  <div>Created: {new Date(video.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={() => shareVideo(video)}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    Share
                  </button>
                  <a 
                    href={video.url} 
                    download={`sketch-video-${video.id}.webm`}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExampleApp; 