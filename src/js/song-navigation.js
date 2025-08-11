
class SongNavigation {
  constructor() {
    this.initializeSongCards();
  }

  initializeSongCards() {
    // Get all song cards from different sections
    const songCards = document.querySelectorAll('.song-card');

    // Add click listeners to song cards
    songCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent triggering if clicking the like button or its icon
        if (!e.target.closest('.like-btn') && !e.target.classList.contains('ri-heart-line') && !e.target.classList.contains('ri-heart-fill')) {
          this.handleSongCardClick(card);
        }
      });
    });
  }

  handleSongCardClick(card) {
    const songData = this.extractSongData(card);
    this.storeSongData(songData);
    this.navigateToPlayer();
  }

  extractSongData(card) {
    let songData = {
      title: 'Unknown Song',
      artist: 'Unknown Artist',
      image: 'src/images/user_img.jpeg',
      albumImage: 'src/images/user_img.jpeg'
    };

    // First try to get API data from card dataset
    if (window.contentLoader) {
      const apiSongData = window.contentLoader.getSongDataFromCard(card);
      if (apiSongData) {
        return window.jioSaavnAPI.transformSongData(apiSongData);
      }
      
      const apiPlaylistData = window.contentLoader.getPlaylistDataFromCard(card);
      if (apiPlaylistData) {
        songData.title = apiPlaylistData.title || apiPlaylistData.name;
        songData.artist = apiPlaylistData.subtitle || apiPlaylistData.description || 'Playlist';
        songData.image = window.jioSaavnAPI.getHighQualityImage(apiPlaylistData.image);
        songData.albumImage = songData.image;
        songData.isPlaylist = true;
        songData.playlistId = apiPlaylistData.id;
        return songData;
      }
    }

    // Fallback to DOM extraction
    if (card.classList.contains('song-card')) {
      const titleElement = card.querySelector('#song-title, h2');
      const artistElement = card.querySelector('#artist-name, span');
      const imageElement = card.querySelector('img');

      if (titleElement) songData.title = titleElement.textContent.trim();
      if (artistElement) songData.artist = artistElement.textContent.trim();
      if (imageElement) {
        songData.image = imageElement.src;
        songData.albumImage = imageElement.src;
      }
    }
    // Extract data from playlist card
    else if (card.classList.contains('card')) {
      const titleElement = card.querySelector('#cardIntro, h2');
      const descElement = card.querySelector('#cardDesc, p');
      
      if (titleElement) songData.title = titleElement.textContent.trim();
      if (descElement) songData.artist = descElement.textContent.trim();
      
      // Set default images for playlist cards
      songData.image = '../images/user_img.jpeg';
      songData.albumImage = '../images/user_img.jpeg';
    }

    return songData;
  }

  storeSongData(songData) {
    // Store in localStorage for persistence across page navigation
    localStorage.setItem('currentSong', JSON.stringify(songData));
  }

  navigateToPlayer() {
    // Check if we're already on a page or need to navigate
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('player.html')) {
      // Already on player page, just update content
      this.updatePlayerContent();
    } else {
      // Navigate to player page
      window.location.href = 'src/pages/player.html';
    }
  }

  updatePlayerContent() {
    const songData = JSON.parse(localStorage.getItem('currentSong') || '{}');
    
    if (Object.keys(songData).length === 0) return;

    // Update song title
    const titleElements = document.querySelectorAll('#song-title');
    titleElements.forEach(el => {
      if (el) el.textContent = songData.title;
    });

    // Update artist name
    const artistElements = document.querySelectorAll('#song-artist');
    artistElements.forEach(el => {
      if (el) el.textContent = songData.artist;
    });

    // Update main image
    const imageElements = document.querySelectorAll('.player-image-wrapper img');
    imageElements.forEach(el => {
      if (el) el.src = songData.image;
    });

    // Update background image
    this.updateBackgroundImage(songData.albumImage);

    // Load audio if audio player is available
    if (window.audioPlayer && songData.id) {
      console.log('Loading audio for song:', songData.title);
      window.audioPlayer.loadSong(songData).then(success => {
        if (success) {
          console.log('Audio loaded successfully');
        } else {
          console.warn('Failed to load audio for song');
        }
      });
    }

    // Update lyrics if lyrics manager is available
    if (window.lyricsManager) {
      console.log('Loading lyrics for song:', songData.title);
      window.lyricsManager.loadSongLyrics(songData);
    }
  }

  updateBackgroundImage(imageUrl) {
    const overlay = document.querySelector('.songs-main-overlay');
    if (overlay) {
      // Create or update the background style
      overlay.style.setProperty('--bg-image', `url("${imageUrl}")`);
      
      // Update the ::before pseudo-element via CSS custom property
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        .songs-main-overlay::before {
          background-image: url("${imageUrl}") !important;
        }
      `;
      
      // Remove any existing dynamic style
      const existingStyle = document.querySelector('#dynamic-bg-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      styleSheet.id = 'dynamic-bg-style';
      document.head.appendChild(styleSheet);
    }
  }

  // Static method to initialize on player page
  static initializePlayerPage() {
    const navigation = new SongNavigation();
    navigation.updatePlayerContent();
    return navigation;
  }
}

// Initialize song navigation
export function initializeSongNavigation() {
  if (document.querySelector('.song-card, .card')) {
    return new SongNavigation();
  }
}

// Initialize player page content
export function initializePlayerPage() {
  if (document.querySelector('.songs-main-overlay')) {
    return SongNavigation.initializePlayerPage();
  }
}

// Auto-initialize based on page context
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSongNavigation();
    initializePlayerPage();
  });
} else {
  initializeSongNavigation();
  initializePlayerPage();
}
