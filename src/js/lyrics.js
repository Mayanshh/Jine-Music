
class LyricsManager {
  constructor() {
    this.lyricsContainer = document.querySelector('.lyrics-container');
    this.currentTime = 0;
    this.isPlaying = false;
    this.activeLineIndex = -1;
    this.lyricsLines = [];
    this.currentSong = null;
    this.hasLyrics = false;

    this.init();
  }

  init() {
    if (!this.lyricsContainer) return;

    // Set up auto-scroll
    this.setupAutoScroll();
    
    // Load lyrics for current song if available
    this.loadCurrentSongLyrics();
    
    // Listen for song changes
    this.setupSongChangeListener();
  }

  setupAutoScroll() {
    if (this.lyricsContainer) {
      this.lyricsContainer.style.scrollBehavior = 'smooth';
    }
  }

  setupSongChangeListener() {
    // Listen for storage changes to detect song changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentSong') {
        this.loadCurrentSongLyrics();
      }
    });

    // Also check periodically for song changes
    setInterval(() => {
      this.checkForSongChange();
    }, 2000);
  }

  checkForSongChange() {
    const currentSongData = localStorage.getItem('currentSong');
    if (currentSongData) {
      const songData = JSON.parse(currentSongData);
      if (!this.currentSong || this.currentSong.id !== songData.id) {
        this.currentSong = songData;
        this.loadSongLyrics(songData);
      }
    }
  }

  async loadCurrentSongLyrics() {
    const currentSongData = localStorage.getItem('currentSong');
    if (currentSongData) {
      try {
        const songData = JSON.parse(currentSongData);
        this.currentSong = songData;
        await this.loadSongLyrics(songData);
      } catch (error) {
        console.error('Error parsing current song data:', error);
        this.showNoLyrics();
      }
    } else {
      this.showNoLyrics();
    }
  }

  async loadSongLyrics(songData) {
    if (!this.lyricsContainer || !songData) {
      this.showNoLyrics();
      return;
    }

    this.showLoadingLyrics();

    try {
      // Check if song has lyrics flag
      if (songData.hasLyrics === false || (songData.lyricsId === null && songData.hasLyrics !== true)) {
        this.showNoLyrics(`No lyrics available for "${songData.title}"`);
        return;
      }

      // Try to fetch lyrics from JioSaavn API
      let lyricsData = null;
      
      if (songData.id) {
        lyricsData = await this.fetchLyricsFromAPI(songData.id);
      }

      if (lyricsData && lyricsData.length > 0) {
        this.displayLyrics(lyricsData);
        this.hasLyrics = true;
      } else {
        // Try alternative lyrics fetching methods
        const alternativeLyrics = await this.fetchAlternativeLyrics(songData);
        
        if (alternativeLyrics && alternativeLyrics.length > 0) {
          this.displayLyrics(alternativeLyrics);
          this.hasLyrics = true;
        } else {
          this.showNoLyrics(`No lyrics found for "${songData.title}"`);
        }
      }

    } catch (error) {
      console.error('Error loading lyrics:', error);
      this.showNoLyrics(`Unable to load lyrics for "${songData.title}"`);
    }
  }

  async fetchLyricsFromAPI(songId) {
    try {
      // Try to get lyrics from JioSaavn API
      const response = await window.jioSaavnAPI.request(`/songs/${songId}/lyrics`);
      
      if (response && response.data && response.data.lyrics) {
        return this.parseLyrics(response.data.lyrics);
      }
    } catch (error) {
      console.log('Lyrics not available from primary API:', error.message);
    }
    
    return null;
  }

  async fetchAlternativeLyrics(songData) {
    try {
      // Get song details which might include lyrics
      const songDetails = await window.jioSaavnAPI.getSongDetails(songData.id);
      
      if (songDetails && songDetails.data && songDetails.data[0]) {
        const song = songDetails.data[0];
        
        // Check if lyrics are available in song details
        if (song.lyrics || song.lyricsSnippet) {
          const lyricsText = song.lyrics || song.lyricsSnippet;
          return this.parseLyricsText(lyricsText);
        }
        
        // Check if hasLyrics is false
        if (song.hasLyrics === false) {
          return null;
        }
      }
    } catch (error) {
      console.log('Alternative lyrics fetch failed:', error.message);
    }
    
    return null;
  }

  parseLyrics(lyricsData) {
    if (typeof lyricsData === 'string') {
      return this.parseLyricsText(lyricsData);
    }
    
    if (Array.isArray(lyricsData)) {
      return lyricsData.map((line, index) => ({
        timestamp: index * 3000, // 3 seconds per line as default
        text: line.text || line
      }));
    }
    
    return null;
  }

  parseLyricsText(lyricsText) {
    if (!lyricsText || typeof lyricsText !== 'string') return null;
    
    const lines = lyricsText.split(/\n|\r\n/).filter(line => line.trim().length > 0);
    
    return lines.map((line, index) => ({
      timestamp: index * 3000, // 3 seconds per line as default
      text: line.trim()
    }));
  }

  displayLyrics(lyricsData) {
    if (!this.lyricsContainer || !lyricsData || lyricsData.length === 0) {
      this.showNoLyrics();
      return;
    }

    this.lyricsContainer.innerHTML = '';
    this.activeLineIndex = -1;
    this.lyricsLines = [];

    lyricsData.forEach((lyric, index) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'lyrics-line upcoming';
      lineDiv.dataset.timestamp = lyric.timestamp;
      lineDiv.dataset.index = index;

      const p = document.createElement('p');
      p.textContent = lyric.text;

      lineDiv.appendChild(p);
      this.lyricsContainer.appendChild(lineDiv);
      this.lyricsLines.push(lineDiv);
    });

    // Initialize first line as upcoming
    this.updateLyricsDisplay();
  }

  showLoadingLyrics() {
    if (!this.lyricsContainer) return;
    
    this.lyricsContainer.innerHTML = `
      <div class="lyrics-loading">
        <div class="loading-spinner"></div>
        <p>Loading lyrics...</p>
      </div>
    `;
    this.hasLyrics = false;
  }

  showNoLyrics(message = 'No lyrics available for this song') {
    if (!this.lyricsContainer) return;
    
    this.lyricsContainer.innerHTML = `
      <div class="no-lyrics">
        <i class="ri-music-2-line"></i>
        <p>${message}</p>
      </div>
    `;
    this.hasLyrics = false;
    this.lyricsLines = [];
  }

  updateLyrics(currentTime) {
    if (!this.hasLyrics || this.lyricsLines.length === 0) return;

    this.currentTime = currentTime;
    let activeIndex = -1;

    // Find the active lyric line based on timestamp
    for (let i = 0; i < this.lyricsLines.length; i++) {
      const timestamp = parseInt(this.lyricsLines[i].dataset.timestamp);
      const nextTimestamp = i < this.lyricsLines.length - 1 
        ? parseInt(this.lyricsLines[i + 1].dataset.timestamp) 
        : Infinity;

      if (currentTime >= timestamp && currentTime < nextTimestamp) {
        activeIndex = i;
        break;
      }
    }

    // Update line states if active line changed
    if (activeIndex !== this.activeLineIndex) {
      this.setActiveLine(activeIndex);
      this.activeLineIndex = activeIndex;
    }
  }

  setActiveLine(activeIndex) {
    this.lyricsLines.forEach((line, index) => {
      // Remove all state classes
      line.classList.remove('active', 'past', 'upcoming');

      if (index === activeIndex) {
        line.classList.add('active');
        this.scrollToActiveLine(line);
      } else if (index < activeIndex) {
        line.classList.add('past');
      } else {
        line.classList.add('upcoming');
      }
    });
  }

  scrollToActiveLine(activeLine) {
    if (!activeLine || !this.lyricsContainer) return;

    const containerHeight = this.lyricsContainer.clientHeight;
    const lineTop = activeLine.offsetTop;
    const lineHeight = activeLine.clientHeight;

    // Calculate position to center the active line
    const targetScrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2);

    this.lyricsContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  }

  updateLyricsDisplay() {
    // Reset all lines to upcoming state initially
    this.lyricsLines.forEach(line => {
      line.classList.remove('active', 'past');
      line.classList.add('upcoming');
    });
  }

  // Public methods for external integration
  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  seek(time) {
    this.updateLyrics(time);
  }

  // Method to refresh lyrics for current song
  async refreshLyrics() {
    if (this.currentSong) {
      await this.loadSongLyrics(this.currentSong);
    }
  }

  // Clear lyrics
  clearLyrics() {
    if (this.lyricsContainer) {
      this.lyricsContainer.innerHTML = '';
    }
    this.lyricsLines = [];
    this.hasLyrics = false;
    this.activeLineIndex = -1;
  }
}

// Initialize lyrics manager when DOM is loaded
export function initializeLyrics() {
  if (document.querySelector('.lyrics-container')) {
    const lyricsManager = new LyricsManager();

    // Make it available globally for integration
    window.lyricsManager = lyricsManager;

    return lyricsManager;
  }
}
