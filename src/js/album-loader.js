
class AlbumLoader {
  constructor() {
    this.currentPage = 0;
    this.songsPerPage = 12;
    this.isLoading = false;
    this.allSongs = [];
    this.loadedSongs = [];
    
    this.initializeElements();
    this.loadInitialSongs();
    this.setupEventListeners();
  }

  initializeElements() {
    this.songsWrapper = document.getElementById('songsWrapper');
    this.loadMoreBtn = document.getElementById('loadMoreBtn');
    this.loadingIndicator = document.getElementById('loadingIndicator');
  }

  setupEventListeners() {
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => this.loadMoreSongs());
    }

    // Infinite scroll (optional)
    window.addEventListener('scroll', () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
        if (!this.isLoading && this.hasMoreSongs()) {
          this.loadMoreSongs();
        }
      }
    });
  }

  async loadInitialSongs() {
    this.showLoading();
    
    try {
      // Check if we have a specific search query from navigation
      const specificQuery = localStorage.getItem('albumSearchQuery');
      const albumTitle = localStorage.getItem('albumTitle');
      
      // Update page title if we have one
      if (albumTitle) {
        const titleElement = document.querySelector('.songs-title-wrapper h1');
        if (titleElement) {
          titleElement.textContent = albumTitle;
        }
      }
      
      let searchQueries;
      if (specificQuery) {
        // Use specific search and related queries
        searchQueries = [specificQuery];
        
        // Add related searches based on the specific query
        if (specificQuery.includes('chill')) {
          searchQueries.push('relaxing hindi', 'peaceful bollywood', 'calm hindi songs');
        } else if (specificQuery.includes('workout')) {
          searchQueries.push('energetic bollywood', 'gym hindi songs', 'upbeat hindi');
        } else if (specificQuery.includes('instrumental')) {
          searchQueries.push('hindi instrumental', 'bollywood bgm', 'meditation music');
        } else if (specificQuery.includes('romantic')) {
          searchQueries.push('love hindi songs', 'romantic bollywood', 'hindi romantic');
        }
        
        // Clear the stored query
        localStorage.removeItem('albumSearchQuery');
        localStorage.removeItem('albumTitle');
      } else {
        // Default popular searches
        searchQueries = ['bollywood hits', 'arijit singh', 'shreya ghoshal', 'hindi songs', 'latest hindi'];
      }
      
      const searchPromises = searchQueries.map(query => 
        window.jioSaavnAPI.searchSongs(query, 20)
      );

      const results = await Promise.allSettled(searchPromises);
      let songs = [];

      // Collect songs from all successful searches
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value?.success && result.value?.data?.results) {
          songs = [...songs, ...result.value.data.results];
        }
      });

      // Remove duplicates based on song ID
      this.allSongs = songs.filter((song, index, self) => 
        index === self.findIndex(s => s.id === song.id)
      );

      console.log('Loaded songs:', this.allSongs.length);
      
      if (this.allSongs.length === 0) {
        this.showError('No songs found. Please check your internet connection.');
        return;
      }
      
      // Load first page
      this.loadMoreSongs();
      
    } catch (error) {
      console.error('Error loading songs:', error);
      this.showError('Failed to load songs. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  async loadMoreSongs() {
    if (this.isLoading || !this.hasMoreSongs()) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const startIndex = this.currentPage * this.songsPerPage;
      const endIndex = startIndex + this.songsPerPage;
      const songsToLoad = this.allSongs.slice(startIndex, endIndex);

      songsToLoad.forEach(song => {
        const songElement = this.createSongElement(song);
        this.songsWrapper.appendChild(songElement);
        this.loadedSongs.push(song);
      });

      this.currentPage++;
      
      // Update load more button
      if (!this.hasMoreSongs()) {
        this.loadMoreBtn.style.display = 'none';
      }

    } catch (error) {
      console.error('Error loading more songs:', error);
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  createSongElement(song) {
    const songCard = document.createElement('div');
    songCard.className = 'song-card clickable-card';
    songCard.dataset.songId = song.id;
    songCard.dataset.songData = JSON.stringify(song);

    const imageUrl = window.jioSaavnAPI.getHighQualityImage(song.image);
    const artistName = window.jioSaavnAPI.extractArtistNames(song.artists || song.primaryArtists);
    const songTitle = song.name || song.title || 'Unknown Song';

    songCard.innerHTML = `
      <div class="song-info-wrapper">
         <img src="${imageUrl}" alt="${songTitle}" onerror="this.src='../images/user_img.jpeg'"/>
         <div class="song-info">
            <h2 id="song-title">${songTitle}</h2>
            <h3>by <span id="artist-name">${artistName}</span></h3>
         </div>
      </div>
      <div class="song-actions">
        <button class="song-play-btn"><i class="ri-play-mini-fill"></i></button>
        <i class="ri-heart-line like-btn" data-action="like"></i>
      </div>
    `;

    // Add click event for navigation to player
    songCard.addEventListener('click', (e) => {
      if (!e.target.closest('.song-play-btn')) {
        this.navigateToPlayer(song);
      }
    });

    // Remove play button if it exists
    const playBtn = songCard.querySelector('.song-play-btn');
    if (playBtn) {
      playBtn.remove();
    }

    return songCard;
  }

  navigateToPlayer(song) {
    // Transform song data to the format expected by the player
    const songData = {
      id: song.id,
      title: song.name || song.title || 'Unknown Song',
      artist: window.jioSaavnAPI.extractArtistNames(song.artists || song.primaryArtists),
      image: window.jioSaavnAPI.getHighQualityImage(song.image),
      albumImage: window.jioSaavnAPI.getHighQualityImage(song.image),
      album: song.album?.name || 'Unknown Album',
      duration: song.duration || 0,
      year: song.year || '',
      playUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || ''
    };

    // Store in localStorage
    localStorage.setItem('currentSong', JSON.stringify(songData));

    // Navigate to player
    window.location.href = 'player.html';
  }

  hasMoreSongs() {
    return this.currentPage * this.songsPerPage < this.allSongs.length;
  }

  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'block';
    }
    if (this.loadMoreBtn) {
      this.loadMoreBtn.disabled = true;
      this.loadMoreBtn.textContent = 'Loading...';
    }
  }

  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
    if (this.loadMoreBtn) {
      this.loadMoreBtn.disabled = false;
      this.loadMoreBtn.textContent = 'Load More Songs';
    }
  }

  showError(message = 'Failed to load songs. Please try again later.') {
    if (this.songsWrapper) {
      this.songsWrapper.innerHTML = `
        <div class="api-error">
          <h3>${message}</h3>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: var(--green-clr); color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
        </div>
      `;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('songsWrapper')) {
    window.albumLoader = new AlbumLoader();
  }
});
