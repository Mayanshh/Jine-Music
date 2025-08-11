
/**
 * Like Manager for handling like/unlike functionality in the UI
 */
class LikeManager {
  constructor() {
    this.storageManager = window.storageManager;
    this.initialize();
  }

  initialize() {
    this.setupLikeButtons();
    this.setupLikedSongsDisplay();
  }

  /**
   * Setup like buttons throughout the application
   */
  setupLikeButtons() {
    // Add event listeners to existing like buttons
    document.addEventListener('click', (e) => {
      // Check if clicked element or its parent is a like button
      const likeButton = e.target.closest('.like-btn') || 
                        (e.target.classList && (e.target.classList.contains('ri-heart-line') || 
                         e.target.classList.contains('ri-heart-fill'))) ? e.target : null;
      
      if (likeButton) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Like manager handling click on:', likeButton);
        this.handleLikeButtonClick(likeButton);
      }
    });

    // Update like button states on page load
    setTimeout(() => {
      this.updateAllLikeButtons();
    }, 500);
  }

  /**
   * Handle like button click
   * @param {HTMLElement} button - The clicked like button
   */
  handleLikeButtonClick(button) {
    console.log('Like button clicked:', button);
    
    const card = button.closest('.song-card, .card');
    let songData;
    
    if (!card) {
      // This might be a player page like button, try to get song from localStorage
      console.log('No card found, checking for player song data');
      try {
        const currentSongData = localStorage.getItem('currentSong');
        if (currentSongData) {
          songData = JSON.parse(currentSongData);
          console.log('Using player song data:', songData);
        }
      } catch (error) {
        console.error('Error getting current song:', error);
      }
      
      if (!songData) {
        console.log('No song data available');
        return;
      }
    } else {
      songData = this.extractSongDataFromCard(card);
      if (!songData) {
        console.log('No song data extracted from card');
        return;
      }
    }

    console.log('Song data extracted:', songData);

    const isCurrentlyLiked = this.storageManager.isSongLiked(songData);
    console.log('Currently liked:', isCurrentlyLiked);
    
    if (isCurrentlyLiked) {
      this.storageManager.removeLikedSong(songData);
      this.updateLikeButton(button, false);
      this.showFeedback(`Removed "${songData.title}" from liked songs`);
    } else {
      this.storageManager.addLikedSong(songData);
      this.updateLikeButton(button, true);
      this.showFeedback(`Added "${songData.title}" to liked songs`);
    }

    // Update liked songs display if it's currently shown
    if (document.querySelector('.liked-songs-container')) {
      this.displayLikedSongs();
    }
  }

  /**
   * Extract song data from a card element
   * @param {HTMLElement} card - The card element
   * @returns {Object|null} Song data object
   */
  extractSongDataFromCard(card) {
    try {
      // Try to get API data first
      if (card.dataset.songData) {
        const apiData = JSON.parse(card.dataset.songData);
        return {
          title: apiData.name || apiData.title || 'Unknown Song',
          artist: window.jioSaavnAPI ? 
            window.jioSaavnAPI.extractArtistNames(apiData.artists || apiData.primaryArtists) : 
            'Unknown Artist',
          id: apiData.id,
          image: window.jioSaavnAPI ? 
            window.jioSaavnAPI.getHighQualityImage(apiData.image) : 
            'src/images/user_img.jpeg'
        };
      }

      // Fallback to DOM extraction for static content
      let title = 'Unknown Song';
      let artist = 'Unknown Artist';
      let image = 'src/images/user_img.jpeg';

      // Look for song title
      const titleElement = card.querySelector('h2[id="song-title"], h2');
      if (titleElement) {
        title = titleElement.textContent.trim();
      }

      // Look for artist name - be more specific with selectors
      const artistSpan = card.querySelector('span[id="artist-name"], .song-info span');
      if (artistSpan) {
        artist = artistSpan.textContent.trim();
      } else {
        // Try to find artist in h3 element
        const artistH3 = card.querySelector('h3[id="song-artist"]');
        if (artistH3) {
          const match = artistH3.textContent.match(/by\s+(.+)/i);
          if (match) {
            artist = match[1].trim();
          }
        }
      }

      // Get image
      const imageElement = card.querySelector('img');
      if (imageElement && imageElement.src) {
        image = imageElement.src;
      }

      // Generate a unique ID for static content
      const uniqueId = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

      return {
        title,
        artist,
        id: uniqueId,
        image
      };
    } catch (error) {
      console.error('Error extracting song data:', error);
      return null;
    }
  }

  /**
   * Update like button appearance
   * @param {HTMLElement} button - The like button
   * @param {boolean} isLiked - Whether the song is liked
   */
  updateLikeButton(button, isLiked) {
    // Handle icon inside button
    const icon = button.querySelector('i');
    if (icon) {
      icon.className = isLiked ? 'ri-heart-fill' : 'ri-heart-line';
      button.style.color = isLiked ? '#ff4757' : '';
    } else if (button.classList.contains('ri-heart-line') || button.classList.contains('ri-heart-fill')) {
      // Direct icon element
      button.className = isLiked ? 'ri-heart-fill liked' : 'ri-heart-line';
      button.style.color = isLiked ? '#ff4757' : '';
    }
    
    // Add/remove liked class
    button.classList.toggle('liked', isLiked);
  }

  /**
   * Update all like buttons on the page
   */
  updateAllLikeButtons() {
    const likeButtons = document.querySelectorAll('.like-btn');
    
    likeButtons.forEach(button => {
      const card = button.closest('.song-card, .card');
      if (card) {
        const songData = this.extractSongDataFromCard(card);
        if (songData) {
          const isLiked = this.storageManager.isSongLiked(songData);
          this.updateLikeButton(button, isLiked);
        }
      }
    });
  }

  /**
   * Setup liked songs display functionality
   */
  setupLikedSongsDisplay() {
    // Setup toggle functionality for existing toggle buttons
    this.setupToggleButtons();
  }

  /**
   * Setup toggle buttons functionality
   */
  setupToggleButtons() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const type = button.dataset.type;
        
        // Update active state
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show appropriate content
        if (type === 'liked') {
          this.showLikedSongs();
        } else {
          this.showAllSongs();
        }
      });
    });

    // Check if we should show liked songs automatically
    const showLikedSongs = localStorage.getItem('showLikedSongs');
    if (showLikedSongs === 'true') {
      localStorage.removeItem('showLikedSongs');
      
      // Set liked button as active and show liked songs
      const likedButton = document.querySelector('.toggle-btn[data-type="liked"]');
      if (likedButton) {
        toggleButtons.forEach(btn => btn.classList.remove('active'));
        likedButton.classList.add('active');
        
        // Update toggle overlay position
        const toggleOverlay = document.querySelector('.toggle-overlay');
        if (toggleOverlay) {
          toggleOverlay.style.transform = 'translateX(100%)';
        }
        
        this.showLikedSongs();
      }
    }
  }

  /**
   * Show liked songs only
   */
  showLikedSongs() {
    const songsWrapper = document.getElementById('songsWrapper');
    if (!songsWrapper) return;

    const likedSongs = this.storageManager.getLikedSongs();
    
    if (likedSongs.length === 0) {
      songsWrapper.innerHTML = `
        <div class="liked-songs-empty">
          <h3>No Liked Songs</h3>
          <p>Songs you like will appear here</p>
        </div>
      `;
      return;
    }

    songsWrapper.innerHTML = likedSongs.map(song => `
      <div class="song-card clickable-card liked-song-card">
        <div class="song-info-wrapper">
          <img src="${song.image || 'src/images/user_img.jpeg'}" alt="${song.title}" />
          <div class="song-info">
            <h2>${song.title}</h2>
            <h3>by <span>${song.artist}</span></h3>
            <small>Added ${this.formatDate(song.dateAdded)}</small>
          </div>
        </div>
        <button class="like-btn liked">
          <i class="ri-heart-fill"></i>
        </button>
      </div>
    `).join('');

    // Re-initialize like buttons for the new content
    this.updateAllLikeButtons();
  }

  /**
   * Show all songs (restore original content)
   */
  showAllSongs() {
    // Reload the page to show all songs again
    if (window.albumLoader) {
      const songsWrapper = document.getElementById('songsWrapper');
      if (songsWrapper) {
        songsWrapper.innerHTML = '';
        window.albumLoader.currentPage = 0;
        window.albumLoader.loadedSongs = [];
        window.albumLoader.loadMoreSongs();
      }
    } else {
      window.location.reload();
    }
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'today';
      if (diffDays === 2) return 'yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'recently';
    }
  }

  /**
   * Show feedback message to user
   * @param {string} message - Feedback message
   */
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

// Initialize like manager when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.storageManager) {
      window.likeManager = new LikeManager();
    }
  });
} else {
  if (window.storageManager) {
    window.likeManager = new LikeManager();
  }
}

export default LikeManager;
