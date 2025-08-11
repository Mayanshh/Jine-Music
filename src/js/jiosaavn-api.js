
class JioSaavnAPI {
  constructor() {
    this.baseUrl = 'https://saavn.dev/api';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Generic API request with caching and error handling
  async request(endpoint, useCache = true) {
    const cacheKey = endpoint;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Using cached data for:', endpoint);
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      console.log('Making API request to:', `${this.baseUrl}${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response received:', data);
      
      // Cache successful responses
      if (useCache && data && data.success !== false) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error('JioSaavn API Error details:', {
        endpoint,
        error: error.message,
        stack: error.stack
      });
      
      // If CORS error, try alternative approach
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.warn('CORS error detected, using fallback data');
        return this.getFallbackData(endpoint);
      }
      
      return this.getFallbackData(endpoint);
    }
  }

  // Fallback data when API fails - return empty results instead of dummy data
  getFallbackData(endpoint) {
    console.error('API failed for endpoint:', endpoint, 'Returning empty results');
    
    if (endpoint.includes('/search/songs')) {
      return {
        success: false,
        data: {
          results: []
        }
      };
    }
    
    if (endpoint.includes('/modules')) {
      return {
        success: false,
        data: {
          trending: { songs: [] },
          charts: [],
          albums: [],
          playlists: []
        }
      };
    }
    
    return { success: false, data: null };
  }

  // Search songs by query
  async searchSongs(query, limit = 20) {
    if (!query || query.trim().length === 0) {
      return { data: { results: [] } };
    }
    
    const response = await this.request(`/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response;
  }

  // Get song details by ID
  async getSongDetails(songId) {
    const response = await this.request(`/songs?id=${songId}`);
    return response;
  }

  // Get lyrics for a song
  async getSongLyrics(songId) {
    try {
      const response = await this.request(`/songs?id=${songId}`);
      
      if (response && response.data && response.data[0]) {
        const song = response.data[0];
        
        // Check if song has lyrics
        if (song.hasLyrics === false) {
          return { success: false, message: 'No lyrics available' };
        }
        
        // Return lyrics if available
        if (song.lyrics) {
          return { 
            success: true, 
            data: { 
              lyrics: song.lyrics,
              hasLyrics: true 
            } 
          };
        }
        
        // Try to get lyrics from alternative fields
        if (song.lyricsSnippet) {
          return { 
            success: true, 
            data: { 
              lyrics: song.lyricsSnippet,
              hasLyrics: true 
            } 
          };
        }
      }
      
      return { success: false, message: 'Lyrics not found' };
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      return { success: false, message: 'Failed to fetch lyrics' };
    }
  }

  // Get album details by ID
  async getAlbumDetails(albumId) {
    const response = await this.request(`/albums?id=${albumId}`);
    return response;
  }

  // Get playlist details by ID
  async getPlaylistDetails(playlistId) {
    const response = await this.request(`/playlists?id=${playlistId}`);
    return response;
  }

  // Get trending content by language
  async getTrendingContent(language = 'hindi') {
    const response = await this.request(`/modules?language=${language}`);
    return response;
  }

  // Get top charts
  async getTopCharts() {
    const response = await this.request('/modules?language=hindi');
    return response;
  }

  // Search all types (songs, albums, playlists, artists)
  async searchAll(query, limit = 10) {
    if (!query || query.trim().length === 0) {
      return {
        songs: [],
        albums: [],
        playlists: [],
        artists: []
      };
    }

    try {
      const [songsRes, albumsRes, playlistsRes] = await Promise.allSettled([
        this.request(`/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`),
        this.request(`/search/albums?query=${encodeURIComponent(query)}&limit=${limit}`),
        this.request(`/search/playlists?query=${encodeURIComponent(query)}&limit=${limit}`)
      ]);

      return {
        songs: songsRes.status === 'fulfilled' ? songsRes.value.data?.results || [] : [],
        albums: albumsRes.status === 'fulfilled' ? albumsRes.value.data?.results || [] : [],
        playlists: playlistsRes.status === 'fulfilled' ? playlistsRes.value.data?.results || [] : [],
        artists: [] // Artists search can be added if endpoint available
      };
    } catch (error) {
      console.error('Search all error:', error);
      return {
        songs: [],
        albums: [],
        playlists: [],
        artists: []
      };
    }
  }

  // Transform song data to app format
  transformSongData(song) {
    if (!song) return null;
    
    const audioUrls = this.getAudioUrls(song);
    
    return {
      id: song.id,
      title: song.name || song.title || 'Unknown Song',
      artist: this.extractArtistNames(song.artists || song.primaryArtists),
      image: this.getHighQualityImage(song.image),
      albumImage: this.getHighQualityImage(song.image),
      album: song.album?.name || 'Unknown Album',
      duration: song.duration || 0,
      year: song.year || '',
      playUrl: audioUrls.high || audioUrls.medium || audioUrls.low || '',
      audioUrls: audioUrls,
      quality: audioUrls.high ? 'high' : (audioUrls.medium ? 'medium' : 'low'),
      hasAudio: !!(audioUrls.high || audioUrls.medium || audioUrls.low)
    };
  }

  // Get audio URLs from song data
  getAudioUrls(song) {
    const urls = {
      low: '',
      medium: '',
      high: ''
    };

    // Check downloadUrl array
    if (song.downloadUrl && Array.isArray(song.downloadUrl)) {
      song.downloadUrl.forEach(urlObj => {
        if (urlObj.quality === '96kbps' || urlObj.quality === 'low') {
          urls.low = urlObj.url || urlObj.link || '';
        } else if (urlObj.quality === '160kbps' || urlObj.quality === 'medium') {
          urls.medium = urlObj.url || urlObj.link || '';
        } else if (urlObj.quality === '320kbps' || urlObj.quality === 'high') {
          urls.high = urlObj.url || urlObj.link || '';
        }
      });
    }

    // Fallback to direct properties
    if (!urls.high && !urls.medium && !urls.low) {
      urls.low = song.more_info?.encrypted_media_url || song.encrypted_media_url || '';
    }

    return urls;
  }

  // Extract artist names from artists array
  extractArtistNames(artists) {
    if (!artists) return 'Unknown Artist';
    
    if (typeof artists === 'string') return artists;
    
    // Handle array of artist objects/strings
    if (Array.isArray(artists)) {
      const names = artists.map(artist => {
        if (typeof artist === 'string') return artist;
        return artist.name || artist.title || 'Unknown Artist';
      }).filter(name => name && name !== 'Unknown Artist');
      
      return names.length > 0 ? names.join(', ') : 'Various Artists';
    }
    
    // Handle nested structure like artists.primary
    if (artists.primary && Array.isArray(artists.primary)) {
      const names = artists.primary.map(artist => {
        if (typeof artist === 'string') return artist;
        return artist.name || artist.title || '';
      }).filter(name => name);
      
      if (names.length > 0) return names.join(', ');
    }
    
    // Handle artists.featured
    if (artists.featured && Array.isArray(artists.featured)) {
      const names = artists.featured.map(artist => {
        if (typeof artist === 'string') return artist;
        return artist.name || artist.title || '';
      }).filter(name => name);
      
      if (names.length > 0) return names.join(', ');
    }
    
    // Handle artists.all
    if (artists.all && Array.isArray(artists.all)) {
      const names = artists.all.map(artist => {
        if (typeof artist === 'string') return artist;
        return artist.name || artist.title || '';
      }).filter(name => name);
      
      if (names.length > 0) return names.join(', ');
    }
    
    return artists.name || artists.title || 'Various Artists';
  }

  // Get highest quality image URL
  getHighQualityImage(imageUrl) {
    if (!imageUrl) return 'src/images/user_img.jpeg';
    
    // Handle different image URL formats
    if (typeof imageUrl === 'string') {
      // Replace with higher quality version
      return imageUrl.replace('150x150', '500x500').replace('50x50', '500x500');
    }
    
    // Handle array format from API
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      const highestQuality = imageUrl[imageUrl.length - 1];
      const url = highestQuality.link || highestQuality.url || highestQuality;
      return typeof url === 'string' ? url.replace('150x150', '500x500').replace('50x50', '500x500') : 'src/images/user_img.jpeg';
    }
    
    // Handle object format
    if (typeof imageUrl === 'object' && imageUrl.link) {
      return imageUrl.link.replace('150x150', '500x500').replace('50x50', '500x500');
    }
    
    return 'src/images/user_img.jpeg';
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create global instance
window.jioSaavnAPI = new JioSaavnAPI();

export { JioSaavnAPI };
export default window.jioSaavnAPI;
