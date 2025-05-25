# 🎨 Sketch Video Composer

A comprehensive solution for combining children's sketches with AI-generated monster videos, complete with text overlays and downloadable output. Perfect for bringing kids' drawings to life!

## ✨ Features

- **9:16 Vertical Video Format** - Perfect for social media sharing
- **Real-time Preview** - See your composition as you build it
- **Customizable Text Overlays** - Monster name and child's age
- **Flexible Positioning** - Drag and resize sketch overlay
- **Multiple Output Options** - Client-side and server-side processing
- **Professional Quality** - High-resolution output with smooth animations
- **Mobile Friendly** - Responsive design works on all devices

## 🚀 Quick Start

### Option 1: Client-Side Only (Simple Setup)

1. **Open the HTML file**:
   ```bash
   open video-composer.html
   ```

2. **Upload your files**:
   - Background video (AI-generated monster)
   - Original sketch image
   - Enter monster name and child's age

3. **Customize and Record**:
   - Position and resize the sketch overlay
   - Click "Start Recording"
   - Download your composed video

### Option 2: React Component Integration

1. **Install dependencies**:
   ```bash
   npm install react
   ```

2. **Import and use the component**:
   ```jsx
   import SketchVideoComposer from './SketchVideoComposer';

   function App() {
     const handleVideoGenerated = (blob, url) => {
       console.log('Video ready!', { blob, url });
     };

     return (
       <SketchVideoComposer 
         onVideoGenerated={handleVideoGenerated}
         defaultMonsterName="Friendly Dragon"
         defaultAge={7}
       />
     );
   }
   ```

### Option 3: Server-Side Processing (Advanced)

1. **Install FFmpeg**:
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **API Usage**:
   ```javascript
   const formData = new FormData();
   formData.append('video', videoFile);
   formData.append('sketch', sketchFile);
   formData.append('monsterName', 'Whiskers');
   formData.append('childAge', '8');
   formData.append('sketchX', '20');
   formData.append('sketchY', '520');
   formData.append('sketchSize', '120');
   formData.append('duration', '5');

   const response = await fetch('/api/compose-video', {
     method: 'POST',
     body: formData
   });

   const result = await response.json();
   console.log('Video ready:', result.downloadUrl);
   ```

## 📱 Design Specifications

Based on your design templates, the system creates videos with:

- **Aspect Ratio**: 9:16 (405x720 pixels)
- **Background**: AI-generated monster video (full screen)
- **Sketch Overlay**: Original drawing (bottom-left, customizable position)
- **Text Elements**:
  - Monster name (large, top center)
  - Child's age (medium, below name)
  - Branding watermark (bottom center)

### Layout Structure

```
┌─────────────────────┐
│    Monster Name     │ ← Large text, centered
│      Age: 8         │ ← Medium text, centered
│                     │
│                     │
│  [AI Monster Video] │ ← Background (full screen)
│                     │
│                     │
│  ┌─────────┐       │
│  │ Sketch  │       │ ← Original drawing overlay
│  │ Image   │       │   (positioned bottom-left)
│  └─────────┘       │
│                     │
│  ✨ AI Sketch Studio │ ← Branding watermark
└─────────────────────┘
```

## 🛠️ API Reference

### Client-Side API

#### SketchVideoComposer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onVideoGenerated` | `function` | - | Callback when video is ready |
| `defaultMonsterName` | `string` | "Whiskers" | Initial monster name |
| `defaultAge` | `number` | 8 | Initial child age |
| `className` | `string` | "" | Additional CSS classes |
| `theme` | `string` | "default" | UI theme |

#### Methods

```javascript
// Programmatically set content
composer.setBackgroundVideo(videoFile);
composer.setSketch(imageFile);
composer.updateText(monsterName, age);

// Control recording
composer.startRecording();
composer.stopRecording();
```

### Server-Side API

#### POST `/api/compose-video`

**Request:**
- `video` (file): Background video
- `sketch` (file): Original sketch image
- `monsterName` (string): Monster name
- `childAge` (number): Child's age
- `sketchX`, `sketchY` (number): Position coordinates
- `sketchSize` (number): Sketch size in pixels
- `duration` (number): Video duration in seconds

**Response:**
```json
{
  "success": true,
  "videoId": "uuid",
  "downloadUrl": "/videos/composed-uuid.mp4",
  "fileSize": 1234567,
  "duration": 5
}
```

#### POST `/api/compose-video-enhanced`

Enhanced version with additional effects:

**Additional Parameters:**
- `effects.roundedCorners` (boolean): Add rounded corners to sketch
- `effects.shadow` (boolean): Add drop shadow
- `effects.animatedText` (boolean): Animate text appearance

#### POST `/api/convert-video/:videoId`

Convert existing video to different format/quality:

**Request:**
```json
{
  "format": "mp4",
  "quality": "high"
}
```

## 🎨 Customization

### Styling the React Component

```jsx
<SketchVideoComposer 
  className="my-composer"
  onVideoGenerated={handleVideo}
/>

<style jsx>{`
  .my-composer {
    --primary-color: #ff6b6b;
    --secondary-color: #4ecdc4;
    --background-color: #f8f9fa;
  }
`}</style>
```

### Custom Text Styling

```css
.sketch-video-composer .text-overlay {
  font-family: 'Comic Sans MS', cursive;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}
```

### Animation Effects

The system supports various animation effects:

- **Fade In Text**: Text appears gradually
- **Bounce Sketch**: Sketch bounces into position
- **Particle Effects**: Sparkles around the sketch
- **Background Filters**: Apply effects to the monster video

## 📂 File Structure

```
sketch-video-composer/
├── video-composer.html          # Standalone HTML version
├── SketchVideoComposer.jsx      # React component
├── example-usage.jsx            # Usage examples
├── server-video-processor.js    # Node.js server
├── package.json                 # Dependencies
├── Images/                      # Design templates
│   ├── Reference.png
│   ├── Sketch-Post-Template-BLANK.png
│   └── ...
├── uploads/                     # Temporary uploads (created automatically)
├── output/                      # Generated videos (created automatically)
└── temp/                        # Temporary files (created automatically)
```

## 🔧 Technical Requirements

### Client-Side
- Modern browser with Canvas support
- MediaRecorder API support
- File API support

### Server-Side
- Node.js 16+
- FFmpeg installed
- At least 2GB RAM for video processing
- Sufficient disk space for uploads and output

## 🎯 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 85+ | ✅ Full | Recommended |
| Firefox 85+ | ✅ Full | Good performance |
| Safari 14+ | ✅ Full | Works well on iOS |
| Edge 85+ | ✅ Full | Chromium-based |

## 📊 Performance Tips

1. **Video Size**: Keep background videos under 50MB for best performance
2. **Sketch Images**: Use PNG/JPEG under 5MB
3. **Duration**: 3-10 seconds works best for social sharing
4. **Quality**: Choose appropriate quality settings for your use case

## 🐛 Troubleshooting

### Common Issues

**"Recording failed"**
- Check browser permissions for media recording
- Ensure sufficient memory available

**"Video not loading"**
- Verify video format is supported (MP4, WebM, MOV)
- Check file size limits

**"Server error during composition"**
- Ensure FFmpeg is properly installed
- Check server logs for detailed errors
- Verify file permissions in upload/output directories

### Performance Issues

- Reduce video resolution/quality
- Use shorter duration
- Close other browser tabs
- Try server-side processing for complex compositions

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🎉 Examples

Check out the `example-usage.jsx` file for comprehensive examples of:
- Basic usage
- Custom styling
- Server integration
- Error handling
- Advanced features

---

Made with ❤️ for creative kids and their amazing sketches! 