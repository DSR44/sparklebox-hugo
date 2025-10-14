# Soundbox v2 - Sparklebox by Elvida

A production-grade, accessible, mobile-first ambient music player built with vanilla JavaScript, HTML, and CSS. Designed to be dropped into any WordPress page or served as a static site.

## ✨ Features

- **Glassmorphism Design**: Modern dark theme with subtle glass effects and gradients
- **Mobile-First**: Responsive layout that works perfectly on all devices
- **Accessibility**: Full WCAG AA compliance with keyboard navigation and screen reader support
- **Media Session API**: Native lock-screen controls and hardware key support
- **Advanced Player**: Sticky mini-player with seek, volume, and optional waveform visualization
- **Smart Filtering**: Tag-based filtering with visual chips
- **Deep Linking**: Direct track URLs with `?t=track-id` parameter
- **State Persistence**: Remembers your last played track and settings
- **Performance Optimized**: Lazy audio loading, CSS containment, and efficient rendering

## 🏗️ Architecture

### Core Files
- `index.html` - Semantic HTML structure with accessibility features
- `css/soundbox.css` - CSS with custom properties, glassmorphism, and responsive design
- `js/soundbox.js` - Vanilla JavaScript player with full functionality
- `data/tracks.json` - Track metadata and configuration

### Asset Directories
- `images/` - Cover art (800x450px recommended)
- `audio/` - MP3 files (320kbps+ recommended)
- `clips/` - Optional looping video clips (MP4, 15-30s, muted)

## 🎵 Track Configuration

Edit `data/tracks.json` to customize your tracks:

```json
{
  "id": "unique-id",
  "title": "Track Title",
  "description": "Brief description of the track",
  "tags": ["ambient", "focus", "chill"],
  "src": "audio-file.mp3",
  "cover": "cover-image.jpg",
  "clip": "optional-video-loop.mp4",
  "duration": 600,
  "artist": "Artist Name"
}
```

## 🎨 Theming

The design uses CSS custom properties for easy theming:

```css
:root {
  --bg: #0f1115;                    /* Background */
  --card: rgba(255,255,255,0.04);   /* Card background */
  --border: rgba(255,255,255,0.08); /* Borders */
  --text: #ffffff;                  /* Primary text */
  --muted: rgba(255,255,255,0.6);   /* Secondary text */
  --accent-start: #8b5cf6;          /* Gradient start */
  --accent-end: #06b6d4;            /* Gradient end */
}
```

## 🚀 Deployment

### Static Site
1. Upload all files to your web server
2. Ensure proper MIME types for audio/video files
3. Add your audio files to the `audio/` directory
4. Add cover images to the `images/` directory
5. Update `data/tracks.json` with your track information

### WordPress Integration
1. Upload files to your theme or plugin directory
2. Enqueue the CSS and JS files in your theme
3. Use the HTML structure in a page template or shortcode
4. Ensure WordPress handles the audio/image uploads

### Development Server
```bash
# Simple Python server
python -m http.server 8000

# Or Node.js server
npx serve .
```

## 🎯 Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+
- **Features**: Media Session API (Chrome/Edge), Web Audio API (optional waveform)

## ♿ Accessibility Features

- Full keyboard navigation (Space, Arrow keys)
- Screen reader compatible with proper ARIA labels
- High contrast mode support
- Reduced motion preference respect
- Focus indicators and semantic HTML
- Color contrast meeting WCAG AA standards

## 🔧 Advanced Features

### Waveform Visualization
Toggle the waveform view in the mini-player to load WaveSurfer.js dynamically for visual audio representation.

### Deep Linking
Link directly to tracks: `yoursite.com/soundbox?t=track-id`

### Keyboard Shortcuts
- `Space` - Play/Pause
- `←/→` - Seek backward/forward 10s
- `↑/↓` - Volume up/down
- `Tab` - Navigate controls

## 📱 Performance

- **Lazy Loading**: Audio files load only when played
- **Efficient Rendering**: CSS containment and optimized animations
- **Memory Management**: Proper cleanup of audio resources
- **Responsive Images**: Optimized for different screen densities

## 🛠️ Customization

### Adding New Tracks
1. Upload audio file to `audio/`
2. Upload cover image to `images/`
3. Optionally add video loop to `clips/`
4. Add track entry to `data/tracks.json`

### Styling Modifications
All visual aspects can be customized through CSS custom properties and the comprehensive CSS architecture.

### Functionality Extensions
The modular JavaScript class structure makes it easy to extend functionality while maintaining the existing API.

## 📄 License

Built for Sparklebox by Elvida. Customize and deploy as needed for your ambient music projects.

---

*Designed for creators who value both aesthetics and accessibility in their digital audio experiences.*
