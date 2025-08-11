export function initializeSearch() {
  console.log('Initializing search functionality...');

  const searchIcon = document.querySelector('.navbar ul li i.ri-search-line');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchInput = document.getElementById('searchInput');
  const searchCloseBtn = document.getElementById('searchCloseBtn');

  console.log('Search elements found:', {
    searchIcon: !!searchIcon,
    searchOverlay: !!searchOverlay,
    searchInput: !!searchInput,
    searchCloseBtn: !!searchCloseBtn
  });

  if (!searchIcon || !searchOverlay || !searchInput || !searchCloseBtn) {
    console.log('Missing search elements, search functionality not initialized');
    return;
  }

  console.log('Search functionality initialized successfully');

  // Open search overlay
  searchIcon.addEventListener('click', () => {
    openSearchOverlay();
  });

  // Close search overlay
  searchCloseBtn.addEventListener('click', () => {
    closeSearchOverlay();
  });

  // Close on overlay click (but not on search container)
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) {
      closeSearchOverlay();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
      closeSearchOverlay();
    }
  });

  // Search input functionality
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      performSearch(searchInput.value.trim());
    }
  });

  function openSearchOverlay() {
    console.log('Opening search overlay');
    searchOverlay.classList.add('active');
    // Focus on input after animation completes
    setTimeout(() => {
      searchInput.focus();
    }, 300);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  function closeSearchOverlay() {
    searchOverlay.classList.remove('active');
    searchInput.value = '';
    searchInput.blur();

    // Restore body scroll
    document.body.style.overflow = '';

    // Hide any search results
    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
      searchResults.classList.remove('active');
    }
  }

  function handleSearch(e) {
    const query = e.target.value.trim();

    if (query.length === 0) {
      hideSearchResults();
      return;
    }

    // Debounce search to avoid too many calls
    clearTimeout(handleSearch.timeout);
    handleSearch.timeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  }

  async function performSearch(query) {
    try {
      console.log('Performing search for:', query);

      // Use the JioSaavn API instance
      const data = await window.jioSaavnAPI.searchSongs(query);

      if (data && data.data && data.data.results) {
        displaySearchResults(data.data.results, query);
      } else {
        displayError('No results found');
      }
    } catch (error) {
      console.error('Error performing search:', error);
      displayError(`Search failed: ${error.message}`);
    }
  }

  function displaySearchResults(results, query) {
    let searchResultsContainer = document.querySelector('.search-results');

    if (!searchResultsContainer) {
      // Create search results container if it doesn't exist
      searchResultsContainer = document.createElement('div');
      searchResultsContainer.className = 'search-results';
      document.querySelector('.search-container').appendChild(searchResultsContainer);
    }

    if (results.length === 0) {
      searchResultsContainer.innerHTML = `
        <div class="search-result-item">
          <div style="text-align: center; color: rgba(255, 255, 255, 0.6);">
            No results found for "${query}"
          </div>
        </div>
      `;
    } else {
      searchResultsContainer.innerHTML = results.map(result => `
        <div class="search-result-item" data-type="${result.type || 'song'}" data-id="${result.id}">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${window.jioSaavnAPI.getHighQualityImage(result.image)}" alt="${result.title || result.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />
            <div>
              <div style="font-weight: 500; margin-bottom: 2px;">${result.title || result.name}</div>
              <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">by ${window.jioSaavnAPI.extractArtistNames(result.artists || result.primaryArtists)}</div>
            </div>
          </div>
        </div>
      `).join('');

      // Add click handlers for results
      searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const type = item.dataset.type;
          const id = item.dataset.id;
          console.log(`Selected ${type}:`, item.textContent.trim());

          // Find the song data from the results
          const song = results.find(result => result.id === id);
          if (song && type === 'song') {
            navigateToPlayer(song);
          }

          closeSearchOverlay();
        });
      });
    }

    searchResultsContainer.classList.add('active');
  }

  function displayError(message) {
    let searchResultsContainer = document.querySelector('.search-results');
    if (!searchResultsContainer) {
      searchResultsContainer = document.createElement('div');
      searchResultsContainer.className = 'search-results';
      document.querySelector('.search-container').appendChild(searchResultsContainer);
    }
    searchResultsContainer.innerHTML = `
      <div class="search-result-item">
        <div style="text-align: center; color: rgba(255, 255, 255, 0.6);">
          Error: ${message}
        </div>
      </div>
    `;
    searchResultsContainer.classList.add('active');
  }

  function hideSearchResults() {
    const searchResults = document.querySelector('.search-results');
    if (searchResults) {
      searchResults.classList.remove('active');
    }
  }

  function navigateToPlayer(song) {
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
    if (window.location.pathname.includes('pages/')) {
      window.location.href = 'player.html';
    } else {
      window.location.href = 'src/pages/player.html';
    }
  }
}