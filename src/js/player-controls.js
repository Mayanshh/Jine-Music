class PlayerControls {
  constructor() {
    this.isPlaying = false;
    this.isShuffled = false;
    this.isRepeating = false;
    this.currentTime = 0;
    this.totalTime = 204; // 3:24 in seconds
    this.progressInterval = null;
    this.currentSong = null;

    this.initializeElements();
    this.setupEventListeners();
    this.updateDisplay();
    
    // Initialize like button after a delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeLikeButton();
    }, 100);
  }

  initializeElements() {
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.shuffleBtn = document.getElementById('shuffle-btn');
    this.repeatBtn = document.getElementById('repeat-btn');
    this.prevBtn = document.getElementById('prev-btn');
    this.nextBtn = document.getElementById('next-btn');
    this.progressContainer = document.querySelector('.progress-container');
    this.progressBar = document.querySelector('.progress-bar');
    this.progressFill = document.querySelector('.progress-fill');
    this.currentTimeDisplay = document.getElementById('current-time');
    this.totalTimeDisplay = document.getElementById('total-time');
  }

  setupEventListeners() {
    // Play/Pause button
    this.playPauseBtn?.addEventListener('click', () => this.togglePlayPause());

    // Shuffle button
    this.shuffleBtn?.addEventListener('click', () => this.toggleShuffle());

    // Repeat button
    this.repeatBtn?.addEventListener('click', () => this.toggleRepeat());

    // Previous/Next buttons
    this.prevBtn?.addEventListener('click', () => this.previousTrack());
    this.nextBtn?.addEventListener('click', () => this.nextTrack());

    // Progress bar interaction
    this.progressContainer?.addEventListener('click', (e) => this.seekToPosition(e));

    // Initialize time display
    this.updateTimeDisplay();
  }

  togglePlayPause() {
    if (window.audioPlayer) {
      window.audioPlayer.toggle();
    } else {
      // Fallback to simulation if audio player not available
      this.isPlaying = !this.isPlaying;
      const icon = this.playPauseBtn.querySelector('i');

      if (this.isPlaying) {
        icon.className = 'ri-pause-fill';
        this.startTimeSimulation();
      } else {
        icon.className = 'ri-play-fill';
        this.stopTimeSimulation();
      }
    }
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    this.shuffleBtn.classList.toggle('active', this.isShuffled);
  }

  toggleRepeat() {
    this.isRepeating = !this.isRepeating;
    this.repeatBtn.classList.toggle('active', this.isRepeating);
  }

  previousTrack() {
    // Reset to beginning or go to previous song
    this.currentTime = 0;
    this.updateDisplay();
  }

  nextTrack() {
    // Go to next song (simulate)
    console.log('Next track');
  }

  seekToPosition(e) {
    if (!this.progressContainer) return;

    const rect = this.progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    if (window.audioPlayer) {
      const duration = window.audioPlayer.getDuration();
      if (duration > 0) {
        const seekTime = percentage * duration;
        window.audioPlayer.seekTo(seekTime);
      }
    } else {
      // Fallback to simulation
      this.currentTime = Math.max(0, Math.min(this.totalTime, percentage * this.totalTime));
      this.updateDisplay();
    }

    // Update lyrics if available
    if (window.lyricsManager) {
      const seekTime = window.audioPlayer ? window.audioPlayer.getCurrentTime() : this.currentTime;
      window.lyricsManager.seek(seekTime * 1000);
    }
  }

  startTimeSimulation() {
    this.stopTimeSimulation(); // Clear any existing interval
    this.progressInterval = setInterval(() => {
      if (this.currentTime < this.totalTime) {
        this.currentTime += 1;
        this.updateDisplay();

        // Update lyrics with actual audio time if available
        if (window.lyricsManager) {
          const actualTime = window.audioPlayer ? window.audioPlayer.getCurrentTime() * 1000 : this.currentTime * 1000;
          window.lyricsManager.updateLyrics(actualTime);
        }
      } else {
        this.stopTimeSimulation();
        if (!this.isRepeating) {
          this.isPlaying = false;
          const icon = this.playPauseBtn.querySelector('i');
          icon.className = 'ri-play-fill';
        } else {
          this.currentTime = 0;
        }
      }
    }, 1000);
  }

  stopTimeSimulation() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  updateDisplay() {
    this.updateProgressBar();
    this.updateTimeDisplay();
  }

  updateProgressBar() {
    if (!this.progressFill) return;

    const percentage = (this.currentTime / this.totalTime) * 100;
    this.progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  }

  updateTimeDisplay() {
    if (this.currentTimeDisplay) {
      this.currentTimeDisplay.textContent = this.formatTime(this.currentTime);
    }
    if (this.totalTimeDisplay) {
      this.totalTimeDisplay.textContent = this.formatTime(this.totalTime);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setupProgressBar() {
    this.progressContainer = document.querySelector('.progress-container');
    this.progressFill = document.querySelector('.progress-fill');
    this.progressHandle = document.querySelector('.progress-handle');

    if (!this.progressContainer || !this.progressFill || !this.progressHandle) {
      console.log('Progress bar elements not found');
      return;
    }

    // Mouse events
    this.progressContainer.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.handleDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Touch events for mobile
    this.progressContainer.addEventListener('touchstart', (e) => this.startDrag(e));
    document.addEventListener('touchmove', (e) => this.handleDrag(e));
    document.addEventListener('touchend', () => this.endDrag());
  }

  initializeLikeButton() {
    // Wait for DOM to be ready and try multiple selectors
    setTimeout(() => {
      // Try different possible selectors for the like button
      const likeButton = document.querySelector('.songs-title-wrapper .ri-heart-line') ||
                        document.querySelector('.songs-title-wrapper .ri-heart-fill') ||
                        document.querySelector('.like-btn') ||
                        document.querySelector('.ri-heart-line') ||
                        document.querySelector('.ri-heart-fill');

      if (likeButton) {
        console.log('Like button found:', likeButton);
        
        // Remove any existing listeners
        likeButton.replaceWith(likeButton.cloneNode(true));
        const newLikeButton = document.querySelector('.songs-title-wrapper .ri-heart-line') ||
                             document.querySelector('.songs-title-wrapper .ri-heart-fill') ||
                             document.querySelector('.like-btn') ||
                             document.querySelector('.ri-heart-line') ||
                             document.querySelector('.ri-heart-fill');
        
        newLikeButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Player like button clicked');
          this.handleLikeClick(newLikeButton);
        });

        // Load current song and update like button state
        this.loadCurrentSong();
        this.updateLikeButtonState();
      } else {
        console.log('Like button not found in player');
      }
    }, 500);
  }

  handleLikeClick(button) {
    if (!this.currentSong || !window.storageManager) return;

    const isCurrentlyLiked = window.storageManager.isSongLiked(this.currentSong);

    if (isCurrentlyLiked) {
      window.storageManager.removeLikedSong(this.currentSong);
      this.updateLikeButtonUI(button, false);
      this.showFeedback(`Removed "${this.currentSong.title}" from liked songs`);
    } else {
      window.storageManager.addLikedSong(this.currentSong);
      this.updateLikeButtonUI(button, true);
      this.showFeedback(`Added "${this.currentSong.title}" to liked songs`);
    }
  }

  updateLikeButtonUI(button, isLiked) {
    button.className = isLiked ? 'ri-heart-fill' : 'ri-heart-line';
    button.style.color = isLiked ? '#ff4757' : '';
  }

  updateLikeButtonState() {
    const likeButton = document.querySelector('.songs-title-wrapper .ri-heart-line') ||
                      document.querySelector('.songs-title-wrapper .ri-heart-fill') ||
                      document.querySelector('.like-btn') ||
                      document.querySelector('.ri-heart-line') ||
                      document.querySelector('.ri-heart-fill');

    if (likeButton && this.currentSong && window.storageManager) {
      const isLiked = window.storageManager.isSongLiked(this.currentSong);
      console.log('Updating like button state:', { isLiked, song: this.currentSong.title });
      this.updateLikeButtonUI(likeButton, isLiked);
    } else {
      console.log('Cannot update like button state:', {
        hasButton: !!likeButton,
        hasSong: !!this.currentSong,
        hasStorage: !!window.storageManager
      });
    }
  }

  loadCurrentSong() {
    try {
      const songData = localStorage.getItem('currentSong');
      if (songData) {
        this.currentSong = JSON.parse(songData);
        console.log('Current song loaded:', this.currentSong);
        this.updateLikeButtonState();
      } else {
        console.log('No current song data found');
      }
    } catch (error) {
      console.error('Error loading current song:', error);
    }
  }

  setSongData(songData) {
    this.currentSong = songData;
    this.updateLikeButtonState();
  }

  showFeedback(message) {
    // Remove existing feedback
    const existingFeedback = document.querySelector('.like-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'like-feedback';
    feedback.textContent = message;

    // Add to body
    document.body.appendChild(feedback);

    // Show feedback
    setTimeout(() => feedback.classList.add('show'), 100);

    // Remove feedback after 3 seconds
    setTimeout(() => {
      feedback.classList.remove('show');
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }
}

// Initialize player controls
export function initializePlayerControls() {
  if (document.querySelector('.player-controls-wrapper')) {
    const playerControls = new PlayerControls();

    // Make it available globally for integration
    window.playerControls = playerControls;

    return playerControls;
  }
}