
class AudioPlayer {
  constructor() {
    this.audio = null;
    this.currentSong = null;
    this.isInitialized = false;
    
    this.initializePlayer();
  }

  initializePlayer() {
    // Create audio element
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.crossOrigin = 'anonymous';
    
    // Set up event listeners
    this.audio.addEventListener('loadstart', () => console.log('Audio loading started'));
    this.audio.addEventListener('canplay', () => console.log('Audio can start playing'));
    this.audio.addEventListener('error', (e) => this.handleAudioError(e));
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.handleSongEnd());
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    
    this.isInitialized = true;
    console.log('Audio player initialized');
  }

  async loadSong(songData) {
    if (!this.isInitialized || !songData) return false;

    this.currentSong = songData;
    
    try {
      // Try to get song details with download URLs
      let audioUrl = songData.playUrl;
      
      if (!audioUrl && songData.id) {
        console.log('Fetching song details for audio URL...');
        const songDetails = await window.jioSaavnAPI.getSongDetails(songData.id);
        
        if (songDetails?.success && songDetails?.data?.[0]) {
          const detailedSong = songDetails.data[0];
          const audioUrls = window.jioSaavnAPI.getAudioUrls(detailedSong);
          audioUrl = audioUrls.high || audioUrls.medium || audioUrls.low;
        }
      }

      if (!audioUrl) {
        console.error('No audio URL available for song:', songData.title);
        return false;
      }

      console.log('Loading audio URL:', audioUrl);
      
      // Set the audio source
      this.audio.src = audioUrl;
      this.audio.load();
      
      return true;
      
    } catch (error) {
      console.error('Error loading song:', error);
      return false;
    }
  }

  play() {
    if (!this.audio || !this.currentSong) return;
    
    this.audio.play().then(() => {
      console.log('Audio playback started');
      this.updatePlayButton(true);
    }).catch(error => {
      console.error('Audio playback failed:', error);
      this.handleAudioError({ target: { error } });
    });
  }

  pause() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.updatePlayButton(false);
    console.log('Audio playback paused');
  }

  toggle() {
    if (!this.audio) return;
    
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  seekTo(time) {
    if (!this.audio) return;
    
    this.audio.currentTime = time;
  }

  setVolume(volume) {
    if (!this.audio) return;
    
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  updateProgress() {
    if (!this.audio || !this.currentSong) return;
    
    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration || 0;
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill && duration > 0) {
      const percentage = (currentTime / duration) * 100;
      progressFill.style.width = `${percentage}%`;
    }
    
    // Update time displays
    const currentTimeDisplay = document.getElementById('current-time');
    if (currentTimeDisplay) {
      currentTimeDisplay.textContent = this.formatTime(currentTime);
    }
    
    // Update lyrics if available
    if (window.lyricsManager) {
      window.lyricsManager.updateLyrics(currentTime * 1000);
    }
  }

  updateDuration() {
    if (!this.audio) return;
    
    const duration = this.audio.duration || 0;
    const totalTimeDisplay = document.getElementById('total-time');
    if (totalTimeDisplay) {
      totalTimeDisplay.textContent = this.formatTime(duration);
    }
  }

  updatePlayButton(isPlaying) {
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      const icon = playPauseBtn.querySelector('i');
      if (icon) {
        icon.className = isPlaying ? 'ri-pause-fill' : 'ri-play-fill';
      }
    }
  }

  handleAudioError(event) {
    const error = event.target?.error || event;
    console.error('Audio error:', error);
    
    let errorMessage = 'Audio playback failed';
    if (error.code) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Audio playback was aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading audio';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Audio format not supported';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio source not available';
          break;
      }
    }
    
    // Show error to user
    this.showAudioError(errorMessage);
  }

  handleSongEnd() {
    console.log('Song ended');
    this.updatePlayButton(false);
    
    // Handle repeat functionality
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn && repeatBtn.classList.contains('active')) {
      this.audio.currentTime = 0;
      this.play();
    }
  }

  showAudioError(message) {
    const playerWrapper = document.querySelector('.player-controls-wrapper');
    if (playerWrapper) {
      // Remove existing error
      const existingError = playerWrapper.querySelector('.audio-error');
      if (existingError) {
        existingError.remove();
      }
      
      // Add new error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'audio-error api-error';
      errorDiv.style.marginBottom = '10px';
      errorDiv.innerHTML = `
        <p style="margin: 0; font-size: 14px;">${message}</p>
        <small>This might be due to audio restrictions or unavailable content.</small>
      `;
      
      playerWrapper.insertBefore(errorDiv, playerWrapper.firstChild);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0;
  }

  getDuration() {
    return this.audio ? this.audio.duration : 0;
  }

  isPlaying() {
    return this.audio ? !this.audio.paused : false;
  }
}

// Create global audio player instance
window.audioPlayer = new AudioPlayer();

export default window.audioPlayer;
