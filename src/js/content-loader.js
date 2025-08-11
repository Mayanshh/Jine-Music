import jioSaavnAPI from './jiosaavn-api.js';

class ContentLoader {
  constructor() {
    this.isLoading = false;
    this.loadedContent = new Set();
  }

  // Load trending content for home page
  async loadHomeContent() {
    if (this.isLoading) return;

    this.isLoading = true;
    console.log('Loading home content...');

    try {
      // Add loading indicator
      this.showLoadingState();

      // Load content for "All" category by default
      await this.loadCategoryContent('all');

      console.log('Home content updated successfully');

    } catch (error) {
      console.error('Error loading home content:', error);
      this.showErrorState();
    } finally {
      this.hideLoadingState();
      this.isLoading = false;
    }
  }



  // Load content based on category filter
  async loadCategoryContent(category) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      let searchQueries = [];
      let playlistQueries = [];

      switch (category.toLowerCase()) {
        case 'trending':
          searchQueries = [' bollywood trending 2024', 'hindi viral songs', 'popular hindi music', 'trending bollywood'];
          playlistQueries = ['trending hindi playlist', 'viral bollywood hits', 'popular hindi songs', 'bollywood chartbusters'];
          break;
        case 'newrelease':
          searchQueries = ['latest hindi songs 2024', 'new bollywood releases', 'recent hindi music', 'new songs 2024'];
          playlistQueries = ['new release hindi', 'latest bollywood playlist', 'fresh hindi songs', 'new music 2024'];
          break;
        case 'topartists':
          searchQueries = ['arijit singh hits', 'shreya ghoshal songs', 'atif aslam best', 'armaan malik songs'];
          playlistQueries = ['top bollywood artists', 'best hindi singers', 'popular artists playlist', 'famous bollywood singers'];
          break;
        case 'recommended':
          searchQueries = ['best hindi songs ever', 'hindi classics', ' bollywood superhits', 'evergreen hindi'];
          playlistQueries = ['recommended hindi playlist', 'best bollywood collection', 'hindi gems', 'must listen hindi'];
          break;
        default:
          searchQueries = [' Bollywood hits', 'hindi popular songs', 'best hindi music', 'top bollywood'];
          playlistQueries = ['hindi playlist', ' Bollywood collection', 'popular hindi songs', 'best hindi music'];
      }

      // Get real songs from API with higher limits for better variety
      let allSongs = [];
      for (const query of searchQueries) {
        const result = await jioSaavnAPI.searchSongs(query, 15);
        if (result?.data?.results) {
          allSongs = [...allSongs, ...result.data.results];
        }
      }

      // Remove duplicates and get variety
      const uniqueSongs = allSongs.filter((song, index, self) => 
        index === self.findIndex(s => s.id === song.id)
      );

      // Shuffle for better variety
      const shuffledSongs = this.shuffleArray(uniqueSongs).slice(0, 12);

      // Update both playlist cards and song cards with real data
      await this.updateDynamicPlaylistCards(category, playlistQueries);
      await this.updateSongCardsWithRealData(shuffledSongs);
      this.updateSectionTitle(category);

    } catch (error) {
      console.error(`Error loading ${category} content:`, error);
      this.showErrorState();
    } finally {
      this.hideLoadingState();
      this.isLoading = false;
    }
  }

  // Update playlist cards with real dynamic data
  async updateDynamicPlaylistCards(category, playlistQueries) {
    const cardWrapper = document.querySelector('.card-wrapper');
    if (!cardWrapper) return;

    const cards = cardWrapper.querySelectorAll('.card');

    for (let i = 0; i < cards.length && i < playlistQueries.length; i++) {
      const card = cards[i];
      const query = playlistQueries[i];

      try {
        // Get sample songs for this playlist theme
        const result = await jioSaavnAPI.searchSongs(query, 5);
        const songs = result?.data?.results || [];

        if (songs.length > 0) {
          // Update card content based on real data
          const titleElement = card.querySelector('#cardIntro, h2');
          const descElement = card.querySelector('#cardDesc, p');

          // Generate dynamic titles and descriptions
          const playlistInfo = this.generatePlaylistInfo(category, query, songs);

          if (titleElement) {
            titleElement.textContent = playlistInfo.title;
          }

          if (descElement) {
            descElement.textContent = playlistInfo.description;
          }

          // Store real data for navigation
          card.dataset.searchQuery = query;
          card.dataset.cardTitle = playlistInfo.title;
          card.dataset.songCount = songs.length.toString();

          // Add click listener for navigation
          card.removeEventListener('click', card._clickHandler);
          card._clickHandler = (e) => {
            if (!e.target.closest('.action-buttons')) {
              this.navigateToAlbum(query, playlistInfo.title);
            }
          };
          card.addEventListener('click', card._clickHandler);
        }
      } catch (error) {
        console.error('Error updating playlist card:', error);
      }
    }
  }

  // Generate dynamic playlist info based on category and songs
  generatePlaylistInfo(category, query, songs) {
    const artistNames = songs.slice(0, 3).map(song => 
      jioSaavnAPI.extractArtistNames(song.artists || song.primaryArtists)
    ).filter((name, index, self) => self.indexOf(name) === index);

    switch (category.toLowerCase()) {
      case 'trending':
        return {
          title: 'Trending Hits',
          description: `Hot tracks featuring ${artistNames.slice(0, 2).join(', ')} and more`
        };
      case 'newrelease':
        return {
          title: 'Fresh Releases',
          description: `Latest songs from ${artistNames.slice(0, 2).join(', ')} and top artists`
        };
      case 'topartists':
        return {
          title: 'Top Artists Mix',
          description: `Best of ${artistNames.slice(0, 2).join(', ')} and popular singers`
        };
      case 'recommended':
        return {
          title: 'Recommended Gems',
          description: `Handpicked favorites with ${artistNames.slice(0, 2).join(', ')}`
        };
      default:
        return {
          title: 'Popular Collection',
          description: `Great music featuring ${artistNames.slice(0, 2).join(', ')}`
        };
    }
  }

  // Update song cards with real data
  async updateSongCardsWithRealData(songs) {
    const songsSection = document.querySelector('.songs-section');
    if (!songsSection) return;

    const songCards = songsSection.querySelectorAll('.song-card');

    songCards.forEach((card, index) => {
      if (songs[index]) {
        const song = songs[index];
        const imgElement = card.querySelector('img');
        const titleElement = card.querySelector('#song-title, h2');
        const artistElement = card.querySelector('#artist-name, span');

        if (imgElement) {
          imgElement.src = jioSaavnAPI.getHighQualityImage(song.image);
          imgElement.alt = song.name || song.title;
        }

        if (titleElement) {
          titleElement.textContent = song.name || song.title || 'Unknown Song';
        }

        if (artistElement) {
          const artistName = jioSaavnAPI.extractArtistNames(song.artists || song.primaryArtists);
          artistElement.textContent = artistName !== 'Unknown Artist' ? artistName : 'Various Artists';
        }

        // Store song data for navigation
        card.dataset.songId = song.id;
        card.dataset.songData = JSON.stringify(song);

        // Remove any play buttons that might still exist
        const playButton = card.querySelector('.song-play-btn, .play-btn');
        if (playButton) {
          playButton.remove();
        }

        // Ensure like button exists and is properly structured
        let likeButton = card.querySelector('.like-btn');
        if (!likeButton) {
          likeButton = document.createElement('button');
          likeButton.className = 'like-btn';
          likeButton.innerHTML = '<i class="ri-heart-line"></i>';
          card.appendChild(likeButton);
        }
      }
    });
  }

  // Utility function to shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Navigate to album page with search query
  navigateToAlbum(searchQuery, title) {
    // Store the search query and title in localStorage
    localStorage.setItem('albumSearchQuery', searchQuery);
    localStorage.setItem('albumTitle', title || 'Related Songs');

    // Navigate to album page
    window.location.href = 'src/pages/album.html';
  }

  // Navigate to player page with song data
  navigateToPlayer(song) {
    // Store song data for the player
    localStorage.setItem('currentSong', JSON.stringify(song));
    window.location.href = 'src/pages/player.html';
  }

  // Update section title based on category
  updateSectionTitle(category) {
    const titleElement = document.getElementById('cardTitle');
    if (!titleElement) return;

    const titles = {
      all: 'Curated & Trending',
      trending: 'Trending Now',
      newrelease: 'New Releases',
      topartists: 'Top Artists Collection',
      recommended: 'Recommended for You'
    };

    titleElement.textContent = titles[category.toLowerCase()] || titles.all;

    // Update song section title as well
    const songSecTitle = document.getElementById('song-sec-title');
    if (songSecTitle) {
      const songTitles = {
        all: 'Top daily playlists',
        trending: 'Trending songs today',
        newrelease: 'Latest releases',
        topartists: 'Popular artist tracks',
        recommended: 'Songs you might like'
      };
      songSecTitle.textContent = songTitles[category.toLowerCase()] || songTitles.all;
    }
  }

  // Initialize category buttons
  initializeCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.sorting-section button');

    categoryButtons.forEach(button => {
      button.addEventListener('click', async () => {
        // Update active state
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Load content for category
        const category = button.id.replace('-btn', '');
        await this.loadCategoryContent(category);
      });
    });
  }

  // Get cached song data from card
  getSongDataFromCard(card) {
    const songData = card.dataset.songData;
    if (songData) {
      try {
        return JSON.parse(songData);
      } catch (e) {
        console.error('Error parsing song data:', e);
      }
    }
    return null;
  }

  // Get cached playlist data from card
  getPlaylistDataFromCard(card) {
    const playlistData = card.dataset.playlistData;
    if (playlistData) {
      try {
        return JSON.parse(playlistData);
      } catch (e) {
        console.error('Error parsing playlist data:', e);
      }
    }
    return null;
  }

  // Show loading state
  showLoadingState() {
    const main = document.querySelector('.main');
    if (main) {
      main.classList.add('content-loading');
    }
  }

  // Hide loading state
  hideLoadingState() {
    const main = document.querySelector('.main');
    if (main) {
      main.classList.remove('content-loading');
    }
  }

  // Show error state
  showErrorState() {
    const cardTitle = document.getElementById('cardTitle');
    if (cardTitle) {
      cardTitle.innerHTML = 'Content unavailable <small style="color: rgba(255,255,255,0.6);">(using sample data)</small>';
    }
  }

  // --- New methods for API error handling ---
  hideEmptyContent(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.style.display = 'none';
    }
  }

  showApiError() {
    const main = document.querySelector('.main');
    if (main) {
      // Clear any existing content to show the error message cleanly
      main.innerHTML = ''; 
      const errorDiv = document.createElement('div');
      errorDiv.className = 'api-error';
      errorDiv.innerHTML = `
        <h3>Unable to load music content</h3>
        <p>Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Retry</button>
      `;
      main.appendChild(errorDiv);
    }
  }
}

// Initialize content loader
export function initializeContentLoader() {
  const contentLoader = new ContentLoader();

  // Make available globally
  window.contentLoader = contentLoader;

  // Initialize category buttons
  contentLoader.initializeCategoryButtons();

  // Load initial content
  contentLoader.loadHomeContent();

  return contentLoader;
}

export default ContentLoader;