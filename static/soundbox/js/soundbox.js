/**
 * Soundbox v2 - Sparklebox by Elvida
 * Production-grade ambient music player
 * Vanilla JS, Mobile-first, Accessible
 */

class SoundboxPlayer {
  constructor() {
    // State
    this.tracks = [];
    this.currentTrack = null;
    this.currentIndex = -1;
    this.isPlaying = false;
    this.activeFilters = new Set();
    this.wavesurfer = null;
    this.waveformEnabled = false;
    
    // DOM elements
    this.elements = {};
    
    // Audio context for better performance
    this.audioContext = null;
    
    // Initialize the application
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this.bindElements();
      this.setupEventListeners();
      this.setupMediaSession();
      this.setupKeyboardControls();
      
      // Load tracks and initialize UI
      await this.loadTracks();
      this.handleDeepLink();
      this.restorePlayerState();
      
    } catch (error) {
      console.error('Failed to initialize Soundbox:', error);
      this.showError('Failed to initialize the music player. Please refresh the page.');
    }
  }

  /**
   * Bind DOM elements to the class
   */
  bindElements() {
    const elementIds = [
      'app', 'loading', 'error', 'trackGrid', 'emptyState', 'miniPlayer',
      'audioPlayer', 'playBtn', 'prevBtn', 'nextBtn', 'seekBar', 'volumeSlider',
      'muteBtn', 'currentTime', 'duration', 'playerTitle', 'playerArtist',
      'playerCover', 'playerClip', 'waveformToggle', 'waveformContainer'
    ];
    
    elementIds.forEach(id => {
      this.elements[id] = document.getElementById(id);
      if (!this.elements[id]) {
        console.warn(`Element with ID '${id}' not found`);
      }
    });
    
    this.elements.filterChips = document.querySelector('.filter-chips');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Audio player events
    const audio = this.elements.audioPlayer;
    if (audio) {
      audio.addEventListener('loadstart', () => this.onLoadStart());
      audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
      audio.addEventListener('canplay', () => this.onCanPlay());
      audio.addEventListener('timeupdate', () => this.onTimeUpdate());
      audio.addEventListener('ended', () => this.onTrackEnded());
      audio.addEventListener('error', (e) => this.onAudioError(e));
      audio.addEventListener('volumechange', () => this.onVolumeChange());
    }

    // Control buttons
    this.elements.playBtn?.addEventListener('click', () => this.togglePlay());
    this.elements.prevBtn?.addEventListener('click', () => this.previousTrack());
    this.elements.nextBtn?.addEventListener('click', () => this.nextTrack());
    this.elements.muteBtn?.addEventListener('click', () => this.toggleMute());

    // Sliders
    this.elements.seekBar?.addEventListener('input', (e) => this.onSeek(e));
    this.elements.volumeSlider?.addEventListener('input', (e) => this.onVolumeChange(e));

    // Waveform toggle
    this.elements.waveformToggle?.addEventListener('change', (e) => this.toggleWaveform(e.target.checked));

    // Window events
    window.addEventListener('beforeunload', () => this.savePlayerState());
    
    // Visibility change for better performance
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  /**
   * Setup Media Session API for lock screen controls
   */
  setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previousTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && this.elements.audioPlayer) {
          this.elements.audioPlayer.currentTime = details.seekTime;
        }
      });
    }
  }

  /**
   * Setup keyboard controls for accessibility
   */
  setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      // Only handle if mini player is visible and no input is focused
      if (!this.elements.miniPlayer.style.display !== 'none' && 
          !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        
        switch (e.code) {
          case 'Space':
            e.preventDefault();
            this.togglePlay();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            this.seek(-10);
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.seek(10);
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.changeVolume(5);
            break;
          case 'ArrowDown':
            e.preventDefault();
            this.changeVolume(-5);
            break;
        }
      }
    });
  }

  /**
   * Load tracks from JSON file
   */
  async loadTracks() {
    try {
      const response = await fetch('data/tracks.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.tracks = await response.json();
      
      if (!Array.isArray(this.tracks) || this.tracks.length === 0) {
        this.showEmptyState();
        return;
      }
      
      this.renderTracks();
      this.renderFilterChips();
      this.hideLoading();
      
    } catch (error) {
      console.error('Failed to load tracks:', error);
      this.showError('Unable to load music tracks. Please check your connection and try again.');
    }
  }

  /**
   * Render track cards
   */
  renderTracks() {
    const filteredTracks = this.getFilteredTracks();
    
    if (filteredTracks.length === 0) {
      this.showEmptyState();
      return;
    }
    
    const grid = this.elements.trackGrid;
    grid.innerHTML = '';
    
    filteredTracks.forEach((track, index) => {
      const card = this.createTrackCard(track, index);
      grid.appendChild(card);
    });
    
    // Show grid and hide other states
    this.elements.trackGrid.style.display = 'grid';
    this.elements.emptyState.style.display = 'none';
    this.elements.loading.style.display = 'none';
    this.elements.error.style.display = 'none';
  }

  /**
   * Create a track card element
   */
  createTrackCard(track, index) {
    const card = document.createElement('article');
    card.className = 'track-card';
    card.setAttribute('data-track-id', track.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Play ${track.title}`);
    
    // Cover media (image or video)
    const coverHtml = track.clip ? 
      `<video class="cover-video" muted loop>
         <source src="clips/${track.clip}" type="video/mp4">
         <img class="cover-image" src="images/${track.cover}" alt="${track.title} — cover art">
       </video>` :
      `<img class="cover-image" src="images/${track.cover}" alt="${track.title} — cover art">`;
    
    card.innerHTML = `
      <div class="track-cover">
        ${coverHtml}
        <div class="play-overlay">
          <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5,3 19,12 5,21 5,3"></polygon>
          </svg>
        </div>
      </div>
      <div class="track-content">
        <h3 class="track-title">${this.escapeHtml(track.title)}</h3>
        <p class="track-description">${this.escapeHtml(track.description || '')}</p>
        <div class="track-tags">
          ${track.tags.map(tag => 
            `<span class="track-tag">${this.escapeHtml(tag)}</span>`
          ).join('')}
        </div>
      </div>
    `;
    
    // Event listeners
    card.addEventListener('click', () => this.selectTrack(track, index));
    card.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.selectTrack(track, index);
      }
    });
    
    // Video hover effect
    if (track.clip) {
      const video = card.querySelector('.cover-video');
      card.addEventListener('mouseenter', () => video?.play());
      card.addEventListener('mouseleave', () => video?.pause());
    }
    
    return card;
  }

  /**
   * Render filter chips
   */
  renderFilterChips() {
    const allTags = [...new Set(this.tracks.flatMap(track => track.tags))];
    const container = this.elements.filterChips;
    
    container.innerHTML = '';
    
    // Clear filter chip
    const clearChip = document.createElement('button');
    clearChip.className = 'filter-chip clear';
    clearChip.textContent = 'Clear';
    clearChip.setAttribute('aria-label', 'Clear all filters');
    clearChip.addEventListener('click', () => this.clearFilters());
    container.appendChild(clearChip);
    
    // Tag chips
    allTags.forEach(tag => {
      const chip = document.createElement('button');
      chip.className = 'filter-chip';
      chip.textContent = tag;
      chip.setAttribute('data-tag', tag);
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => this.toggleFilter(tag));
      container.appendChild(chip);
    });
  }

  /**
   * Get filtered tracks based on active filters
   */
  getFilteredTracks() {
    if (this.activeFilters.size === 0) {
      return this.tracks;
    }
    
    return this.tracks.filter(track => 
      track.tags.some(tag => this.activeFilters.has(tag))
    );
  }

  /**
   * Toggle filter
   */
  toggleFilter(tag) {
    const chip = document.querySelector(`[data-tag="${tag}"]`);
    
    if (this.activeFilters.has(tag)) {
      this.activeFilters.delete(tag);
      chip.classList.remove('active');
      chip.setAttribute('aria-pressed', 'false');
    } else {
      this.activeFilters.add(tag);
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
    }
    
    this.renderTracks();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.activeFilters.clear();
    document.querySelectorAll('.filter-chip[data-tag]').forEach(chip => {
      chip.classList.remove('active');
      chip.setAttribute('aria-pressed', 'false');
    });
    this.renderTracks();
  }

  /**
   * Select and load a track
   */
  async selectTrack(track, index) {
    try {
      this.currentTrack = track;
      this.currentIndex = index;
      
      // Update UI immediately
      this.updateTrackCards();
      this.updateMiniPlayer();
      this.showMiniPlayer();
      
      // Load audio
      await this.loadAudio(track);
      
      // Auto-play
      await this.play();
      
    } catch (error) {
      console.error('Failed to select track:', error);
      this.showError('Failed to load the selected track. Please try another.');
    }
  }

  /**
   * Load audio for a track
   */
  async loadAudio(track) {
    return new Promise((resolve, reject) => {
      const audio = this.elements.audioPlayer;
      
      const onCanPlay = () => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = (e) => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        reject(new Error(`Failed to load audio: ${track.src}`));
      };
      
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);
      
      audio.src = `audio/${track.src}`;
      audio.load();
    });
  }

  /**
   * Play current track
   */
  async play() {
    try {
      if (!this.elements.audioPlayer.src) return;
      
      await this.elements.audioPlayer.play();
      this.isPlaying = true;
      this.updatePlayButton();
      this.updateMediaSession();
      
      // Start video clip if available
      const video = this.elements.playerClip;
      if (video && video.src) {
        video.play();
      }
      
    } catch (error) {
      console.error('Playback failed:', error);
      this.isPlaying = false;
      this.updatePlayButton();
    }
  }

  /**
   * Pause current track
   */
  pause() {
    this.elements.audioPlayer.pause();
    this.isPlaying = false;
    this.updatePlayButton();
    
    // Pause video clip
    const video = this.elements.playerClip;
    if (video && video.src) {
      video.pause();
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Previous track
   */
  previousTrack() {
    if (this.tracks.length === 0) return;
    
    const newIndex = this.currentIndex > 0 ? 
      this.currentIndex - 1 : 
      this.tracks.length - 1;
    
    this.selectTrack(this.tracks[newIndex], newIndex);
  }

  /**
   * Next track
   */
  nextTrack() {
    if (this.tracks.length === 0) return;
    
    const newIndex = this.currentIndex < this.tracks.length - 1 ? 
      this.currentIndex + 1 : 
      0;
    
    this.selectTrack(this.tracks[newIndex], newIndex);
  }

  /**
   * Seek to position (in seconds)
   */
  seek(seconds) {
    const audio = this.elements.audioPlayer;
    if (audio && audio.duration) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    }
  }

  /**
   * Change volume by delta
   */
  changeVolume(delta) {
    const audio = this.elements.audioPlayer;
    const slider = this.elements.volumeSlider;
    
    if (audio && slider) {
      const newVolume = Math.max(0, Math.min(100, parseInt(slider.value) + delta));
      slider.value = newVolume;
      audio.volume = newVolume / 100;
      this.updateMuteButton();
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    const audio = this.elements.audioPlayer;
    if (audio) {
      audio.muted = !audio.muted;
      this.updateMuteButton();
    }
  }

  /**
   * Toggle waveform visualization
   */
  async toggleWaveform(enabled) {
    this.waveformEnabled = enabled;
    const container = this.elements.waveformContainer;
    
    if (enabled) {
      try {
        // Dynamically import WaveSurfer
        const WaveSurfer = await this.loadWaveSurfer();
        
        // Create waveform instance
        this.wavesurfer = WaveSurfer.create({
          container: '#waveform',
          waveColor: 'rgba(139, 92, 246, 0.3)',
          progressColor: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
          cursorColor: '#ffffff',
          height: 60,
          responsive: true,
          normalize: true
        });
        
        // Load current track
        if (this.elements.audioPlayer.src) {
          this.wavesurfer.load(this.elements.audioPlayer.src);
        }
        
        // Sync with audio player
        this.wavesurfer.on('seek', (progress) => {
          const audio = this.elements.audioPlayer;
          if (audio.duration) {
            audio.currentTime = progress * audio.duration;
          }
        });
        
        container.style.display = 'block';
        
      } catch (error) {
        console.error('Failed to load waveform:', error);
        this.elements.waveformToggle.checked = false;
        this.waveformEnabled = false;
      }
    } else {
      // Destroy waveform
      if (this.wavesurfer) {
        this.wavesurfer.destroy();
        this.wavesurfer = null;
      }
      container.style.display = 'none';
    }
  }

  /**
   * Dynamically load WaveSurfer.js
   */
  async loadWaveSurfer() {
    if (window.WaveSurfer) {
      return window.WaveSurfer;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.esm.js';
      script.type = 'module';
      script.onload = () => resolve(window.WaveSurfer);
      script.onerror = () => reject(new Error('Failed to load WaveSurfer.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Handle deep linking
   */
  handleDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('t');
    
    if (trackId) {
      const trackIndex = this.tracks.findIndex(track => track.id === trackId);
      if (trackIndex !== -1) {
        this.selectTrack(this.tracks[trackIndex], trackIndex);
      }
    }
  }

  /**
   * Save player state to localStorage
   */
  savePlayerState() {
    if (this.currentTrack) {
      const state = {
        trackId: this.currentTrack.id,
        volume: this.elements.volumeSlider?.value || 70,
        muted: this.elements.audioPlayer?.muted || false
      };
      localStorage.setItem('soundbox-state', JSON.stringify(state));
    }
  }

  /**
   * Restore player state from localStorage
   */
  restorePlayerState() {
    try {
      const savedState = localStorage.getItem('soundbox-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Restore volume
        if (this.elements.volumeSlider && state.volume) {
          this.elements.volumeSlider.value = state.volume;
          this.elements.audioPlayer.volume = state.volume / 100;
        }
        
        // Restore mute state
        if (this.elements.audioPlayer && typeof state.muted === 'boolean') {
          this.elements.audioPlayer.muted = state.muted;
          this.updateMuteButton();
        }
        
        // Restore track selection (without autoplay)
        if (state.trackId) {
          const trackIndex = this.tracks.findIndex(track => track.id === state.trackId);
          if (trackIndex !== -1) {
            this.currentTrack = this.tracks[trackIndex];
            this.currentIndex = trackIndex;
            this.updateTrackCards();
            this.updateMiniPlayer();
            this.showMiniPlayer();
            // Note: Not auto-loading/playing, just selecting
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore player state:', error);
    }
  }

  /**
   * Update track cards visual state
   */
  updateTrackCards() {
    document.querySelectorAll('.track-card').forEach(card => {
      const trackId = card.getAttribute('data-track-id');
      if (trackId === this.currentTrack?.id) {
        card.classList.add('playing');
      } else {
        card.classList.remove('playing');
      }
    });
  }

  /**
   * Update mini player with current track info
   */
  updateMiniPlayer() {
    if (!this.currentTrack) return;
    
    const track = this.currentTrack;
    
    // Update text content
    this.elements.playerTitle.textContent = track.title;
    this.elements.playerArtist.textContent = 'Sparklebox by Elvida';
    
    // Update cover image/video
    const coverImg = this.elements.playerCover;
    const coverVideo = this.elements.playerClip;
    
    if (track.clip) {
      coverVideo.src = `clips/${track.clip}`;
      coverVideo.style.display = 'block';
      coverImg.style.display = 'none';
      if (this.isPlaying) {
        coverVideo.play();
      }
    } else {
      coverImg.src = `images/${track.cover}`;
      coverImg.alt = `${track.title} — cover art`;
      coverImg.style.display = 'block';
      coverVideo.style.display = 'none';
    }
  }

  /**
   * Update play button state
   */
  updatePlayButton() {
    const btn = this.elements.playBtn;
    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');
    
    if (this.isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      btn.setAttribute('aria-label', 'Pause');
      btn.setAttribute('aria-pressed', 'true');
      btn.title = 'Pause';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      btn.setAttribute('aria-label', 'Play');
      btn.setAttribute('aria-pressed', 'false');
      btn.title = 'Play';
    }
  }

  /**
   * Update mute button state
   */
  updateMuteButton() {
    const btn = this.elements.muteBtn;
    const volumeIcon = btn.querySelector('.volume-icon');
    const muteIcon = btn.querySelector('.mute-icon');
    const audio = this.elements.audioPlayer;
    
    if (audio.muted || audio.volume === 0) {
      volumeIcon.style.display = 'none';
      muteIcon.style.display = 'block';
      btn.setAttribute('aria-label', 'Unmute');
      btn.title = 'Unmute';
    } else {
      volumeIcon.style.display = 'block';
      muteIcon.style.display = 'none';
      btn.setAttribute('aria-label', 'Mute');
      btn.title = 'Mute';
    }
  }

  /**
   * Update Media Session metadata
   */
  updateMediaSession() {
    if ('mediaSession' in navigator && this.currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentTrack.title,
        artist: 'Sparklebox by Elvida',
        album: 'Soundbox Collection',
        artwork: [
          { 
            src: `images/${this.currentTrack.cover}`,
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });
    }
  }

  /**
   * Show mini player
   */
  showMiniPlayer() {
    this.elements.miniPlayer.style.display = 'block';
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.elements.loading.style.display = 'block';
    this.elements.trackGrid.style.display = 'none';
    this.elements.error.style.display = 'none';
    this.elements.emptyState.style.display = 'none';
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.elements.loading.style.display = 'none';
  }

  /**
   * Show error state
   */
  showError(message) {
    this.elements.error.style.display = 'block';
    this.elements.error.querySelector('p').textContent = message;
    this.elements.loading.style.display = 'none';
    this.elements.trackGrid.style.display = 'none';
    this.elements.emptyState.style.display = 'none';
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    this.elements.emptyState.style.display = 'block';
    this.elements.loading.style.display = 'none';
    this.elements.trackGrid.style.display = 'none';
    this.elements.error.style.display = 'none';
  }

  /**
   * Audio event handlers
   */
  onLoadStart() {
    console.log('Loading started');
  }

  onLoadedMetadata() {
    this.updateDuration();
  }

  onCanPlay() {
    console.log('Can play');
  }

  onTimeUpdate() {
    this.updateProgress();
    
    // Update waveform if enabled
    if (this.wavesurfer && this.elements.audioPlayer.duration) {
      const progress = this.elements.audioPlayer.currentTime / this.elements.audioPlayer.duration;
      this.wavesurfer.seekTo(progress);
    }
  }

  onTrackEnded() {
    this.nextTrack();
  }

  onAudioError(e) {
    console.error('Audio error:', e);
    this.showError('Failed to play the audio track. Please try another.');
  }

  onSeek(e) {
    const audio = this.elements.audioPlayer;
    if (audio.duration) {
      const seekTime = (e.target.value / 100) * audio.duration;
      audio.currentTime = seekTime;
    }
  }

  onVolumeChange(e) {
    const audio = this.elements.audioPlayer;
    if (e && e.target) {
      // From slider
      audio.volume = e.target.value / 100;
    }
    this.updateMuteButton();
  }

  /**
   * Update progress bar and time display
   */
  updateProgress() {
    const audio = this.elements.audioPlayer;
    if (audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      this.elements.seekBar.value = progress;
      
      // Update visual progress fill
      const progressFill = document.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      
      // Update time display
      this.elements.currentTime.textContent = this.formatTime(audio.currentTime);
    }
  }

  /**
   * Update duration display
   */
  updateDuration() {
    const audio = this.elements.audioPlayer;
    if (audio.duration) {
      this.elements.duration.textContent = this.formatTime(audio.duration);
    }
  }

  /**
   * Handle visibility change for performance
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Pause video clips when page is hidden
      const videos = document.querySelectorAll('.cover-video');
      videos.forEach(video => video.pause());
    }
  }

  /**
   * Utility: Format time in MM:SS
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Utility: Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SoundboxPlayer();
});

// Export for testing/external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundboxPlayer;
}
