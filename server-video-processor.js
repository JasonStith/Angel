const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Invalid video file'));
    }
    if (file.fieldname === 'sketch' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid image file'));
    }
    cb(null, true);
  }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/videos', express.static('output'));

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir('./uploads', { recursive: true });
    await fs.mkdir('./output', { recursive: true });
    await fs.mkdir('./temp', { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
};

ensureDirectories();

// Video composition endpoint
app.post('/api/compose-video', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'sketch', maxCount: 1 }
]), async (req, res) => {
  try {
    const { monsterName, childAge, sketchX, sketchY, sketchSize, duration } = req.body;
    
    if (!req.files.video || !req.files.sketch) {
      return res.status(400).json({ error: 'Missing video or sketch file' });
    }

    const videoFile = req.files.video[0];
    const sketchFile = req.files.sketch[0];
    const outputId = uuidv4();
    const outputPath = `./output/composed-${outputId}.mp4`;
    const tempTextPath = `./temp/text-${outputId}.png`;

    // Create text overlay image using ImageMagick (if available) or Canvas
    await createTextOverlay(tempTextPath, monsterName, childAge);

    // Create video composition using FFmpeg
    await new Promise((resolve, reject) => {
      const ffmpegCommand = ffmpeg()
        .input(videoFile.path)
        .input(sketchFile.path)
        .input(tempTextPath)
        .complexFilter([
          // Scale and position the sketch
          `[1:v]scale=${sketchSize}:${sketchSize}[sketch]`,
          
          // Add sketch overlay
          `[0:v][sketch]overlay=${sketchX}:${sketchY}[video_with_sketch]`,
          
          // Add text overlay
          `[video_with_sketch][2:v]overlay=0:0[final]`
        ])
        .outputOptions([
          '-map', '[final]',
          '-map', '0:a?', // Copy audio if it exists
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-preset', 'fast',
          '-crf', '23',
          '-movflags', '+faststart'
        ])
        .duration(duration || 5)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Clean up temporary files
    await Promise.all([
      fs.unlink(videoFile.path).catch(() => {}),
      fs.unlink(sketchFile.path).catch(() => {}),
      fs.unlink(tempTextPath).catch(() => {})
    ]);

    // Get file stats
    const stats = await fs.stat(outputPath);
    
    res.json({
      success: true,
      videoId: outputId,
      downloadUrl: `/videos/composed-${outputId}.mp4`,
      fileSize: stats.size,
      duration: duration || 5
    });

  } catch (error) {
    console.error('Video composition error:', error);
    res.status(500).json({ error: 'Failed to compose video' });
  }
});

// Create text overlay function
const createTextOverlay = async (outputPath, monsterName, childAge) => {
  return new Promise((resolve, reject) => {
    // Using FFmpeg to create text overlay
    ffmpeg()
      .input('color=black@0:405x720:d=1')
      .inputFormat('lavfi')
      .videoFilters([
        `drawtext=text='${monsterName}':fontfile=/System/Library/Fonts/Arial.ttf:fontsize=36:fontcolor=white:x=(w-text_w)/2:y=80:borderw=3:bordercolor=black`,
        `drawtext=text='Age: ${childAge}':fontfile=/System/Library/Fonts/Arial.ttf:fontsize=24:fontcolor=white:x=(w-text_w)/2:y=120:borderw=3:bordercolor=black`,
        `drawtext=text='✨ AI Sketch Studio':fontfile=/System/Library/Fonts/Arial.ttf:fontsize=18:fontcolor=white@0.7:x=(w-text_w)/2:y=690`
      ])
      .outputOptions(['-frames:v', '1'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

// Enhanced composition with effects
app.post('/api/compose-video-enhanced', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'sketch', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      monsterName, 
      childAge, 
      sketchX, 
      sketchY, 
      sketchSize, 
      duration,
      effects = {} 
    } = req.body;
    
    const videoFile = req.files.video[0];
    const sketchFile = req.files.sketch[0];
    const outputId = uuidv4();
    const outputPath = `./output/enhanced-${outputId}.mp4`;

    const filters = [];
    
    // Scale and round corners for sketch
    filters.push(`[1:v]scale=${sketchSize}:${sketchSize}[sketch_scaled]`);
    
    // Add rounded corners to sketch if requested
    if (effects.roundedCorners) {
      filters.push(`[sketch_scaled]format=rgba,geq=lum_expr='p(X,Y)':a_expr='if(gt(min(min(X,${sketchSize}-X),min(Y,${sketchSize}-Y)),8),255,0)'[sketch_rounded]`);
    }
    
    // Position sketch with optional shadow
    const sketchLayer = effects.roundedCorners ? '[sketch_rounded]' : '[sketch_scaled]';
    
    if (effects.shadow) {
      filters.push(`[0:v]${sketchLayer}overlay=${sketchX + 3}:${sketchY + 3}[video_with_shadow]`);
      filters.push(`[video_with_shadow]${sketchLayer}overlay=${sketchX}:${sketchY}[video_with_sketch]`);
    } else {
      filters.push(`[0:v]${sketchLayer}overlay=${sketchX}:${sketchY}[video_with_sketch]`);
    }

    // Add text overlays with animations
    let textFilter = `drawtext=text='${monsterName}':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=80:borderw=3:bordercolor=black`;
    
    if (effects.animatedText) {
      textFilter += `:alpha='if(lt(t,1),t,1)'`; // Fade in effect
    }
    
    textFilter += `,drawtext=text='Age\\: ${childAge}':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=120:borderw=3:bordercolor=black`;
    textFilter += `,drawtext=text='✨ AI Sketch Studio':fontsize=18:fontcolor=white@0.7:x=(w-text_w)/2:y=690`;
    
    filters.push(`[video_with_sketch]${textFilter}[final]`);

    await new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(videoFile.path)
        .input(sketchFile.path);

      // Add background music if provided
      if (req.files.music) {
        command = command.input(req.files.music[0].path);
      }

      command
        .complexFilter(filters)
        .outputOptions([
          '-map', '[final]',
          '-map', '0:a?',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-preset', 'medium',
          '-crf', '20',
          '-movflags', '+faststart'
        ])
        .duration(duration || 5)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Clean up
    await Promise.all([
      fs.unlink(videoFile.path).catch(() => {}),
      fs.unlink(sketchFile.path).catch(() => {}),
    ]);

    const stats = await fs.stat(outputPath);
    
    res.json({
      success: true,
      videoId: outputId,
      downloadUrl: `/videos/enhanced-${outputId}.mp4`,
      fileSize: stats.size,
      duration: duration || 5
    });

  } catch (error) {
    console.error('Enhanced video composition error:', error);
    res.status(500).json({ error: 'Failed to compose enhanced video' });
  }
});

// Convert video format
app.post('/api/convert-video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { format = 'mp4', quality = 'medium' } = req.body;
    
    const inputPath = `./output/composed-${videoId}.mp4`;
    const outputPath = `./output/converted-${videoId}.${format}`;
    
    const qualitySettings = {
      low: { crf: 28, preset: 'fast' },
      medium: { crf: 23, preset: 'medium' },
      high: { crf: 18, preset: 'slow' }
    };
    
    const settings = qualitySettings[quality] || qualitySettings.medium;

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-crf', settings.crf.toString(),
          '-preset', settings.preset,
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const stats = await fs.stat(outputPath);
    
    res.json({
      success: true,
      downloadUrl: `/videos/converted-${videoId}.${format}`,
      fileSize: stats.size
    });

  } catch (error) {
    console.error('Video conversion error:', error);
    res.status(500).json({ error: 'Failed to convert video' });
  }
});

// Get video info
app.get('/api/video-info/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = `./output/composed-${videoId}.mp4`;
    
    const stats = await fs.stat(videoPath);
    
    // Get video metadata using ffprobe
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });

    res.json({
      success: true,
      fileSize: stats.size,
      duration: metadata.format.duration,
      width: metadata.streams[0].width,
      height: metadata.streams[0].height,
      bitrate: metadata.format.bit_rate,
      createdAt: stats.birthtime
    });

  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(404).json({ error: 'Video not found' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Video processing server running on port ${port}`);
});

module.exports = app; 