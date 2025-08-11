/**
 * Storage Manager for handling liked songs, playlists, and albums
 * Stores minimal data (title and artist only) for optimization
 */
class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      LIKED_SONGS: 'jine_liked_songs',
      LIKED_PLAYLISTS: 'jine_liked_playlists',
      LIKED_ALBUMS: 'jine_liked_albums'
    };
  }

  /**
   * Get liked songs from localStorage
   * @returns {Array} Array of liked songs with title and artist
   */
  getLikedSongs() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.LIKED_SONGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting liked songs:', error);
      return [];
    }
  }

  /**
   * Add a song to liked songs
   * @param {Object} song - Song object with title and artist
   * @param {string} song.title - Song title
   * @param {string} song.artist - Song artist
   * @param {string} song.id - Song ID (optional, for uniqueness)
   */
  addLikedSong(song) {
    try {
      const likedSongs = this.getLikedSongs();

      // Check if song already exists (by title and artist)
      const exists = likedSongs.some(s => 
        s.title.toLowerCase() === song.title.toLowerCase() && 
        s.artist.toLowerCase() === song.artist.toLowerCase()
      );

      if (!exists) {
        // Only store essential data
        const songData = {
          title: song.title,
          artist: song.artist,
          id: song.id || Date.now().toString(), // Use provided ID or timestamp
          image: song.image || 'src/images/user_img.jpeg', // Store low-res image
          dateAdded: new Date().toISOString()
        };

        likedSongs.unshift(songData); // Add to beginning for recent first
        localStorage.setItem(this.STORAGE_KEYS.LIKED_SONGS, JSON.stringify(likedSongs));

        console.log('Song added to liked songs:', songData.title);
        return true;
      } else {
        console.log('Song already in liked songs:', song.title);
        return false;
      }
    } catch (error) {
      console.error('Error adding liked song:', error);
      return false;
    }
  }

  /**
   * Remove a song from liked songs
   * @param {Object} song - Song object with title and artist
   */
  removeLikedSong(song) {
    try {
      const likedSongs = this.getLikedSongs();
      const filteredSongs = likedSongs.filter(s => 
        !(s.title.toLowerCase() === song.title.toLowerCase() && 
          s.artist.toLowerCase() === song.artist.toLowerCase())
      );

      localStorage.setItem(this.STORAGE_KEYS.LIKED_SONGS, JSON.stringify(filteredSongs));
      console.log('Song removed from liked songs:', song.title);
      return true;
    } catch (error) {
      console.error('Error removing liked song:', error);
      return false;
    }
  }

  /**
   * Check if a song is liked
   * @param {Object} song - Song object with title and artist
   * @returns {boolean} True if song is liked
   */
  isSongLiked(song) {
    try {
      const likedSongs = this.getLikedSongs();
      return likedSongs.some(s => 
        s.title.toLowerCase() === song.title.toLowerCase() && 
        s.artist.toLowerCase() === song.artist.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking if song is liked:', error);
      return false;
    }
  }

  /**
   * Get liked playlists from localStorage
   * @returns {Array} Array of liked playlists
   */
  getLikedPlaylists() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.LIKED_PLAYLISTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting liked playlists:', error);
      return [];
    }
  }

  /**
   * Add a playlist to liked playlists
   * @param {Object} playlist - Playlist object with title and description
   */
  addLikedPlaylist(playlist) {
    try {
      const likedPlaylists = this.getLikedPlaylists();

      const exists = likedPlaylists.some(p => 
        p.title.toLowerCase() === playlist.title.toLowerCase()
      );

      if (!exists) {
        const playlistData = {
          title: playlist.title,
          artist: playlist.artist || playlist.description || 'Playlist',
          id: playlist.id || Date.now().toString(),
          dateAdded: new Date().toISOString()
        };

        likedPlaylists.unshift(playlistData);
        localStorage.setItem(this.STORAGE_KEYS.LIKED_PLAYLISTS, JSON.stringify(likedPlaylists));

        console.log('Playlist added to liked playlists:', playlistData.title);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding liked playlist:', error);
      return false;
    }
  }

  /**
   * Get liked albums from localStorage
   * @returns {Array} Array of liked albums
   */
  getLikedAlbums() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.LIKED_ALBUMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting liked albums:', error);
      return [];
    }
  }

  /**
   * Add an album to liked albums
   * @param {Object} album - Album object with title and artist
   */
  addLikedAlbum(album) {
    try {
      const likedAlbums = this.getLikedAlbums();

      const exists = likedAlbums.some(a => 
        a.title.toLowerCase() === album.title.toLowerCase()
      );

      if (!exists) {
        const albumData = {
          title: album.title,
          artist: album.artist || 'Unknown Artist',
          id: album.id || Date.now().toString(),
          dateAdded: new Date().toISOString()
        };

        likedAlbums.unshift(albumData);
        localStorage.setItem(this.STORAGE_KEYS.LIKED_ALBUMS, JSON.stringify(likedAlbums));

        console.log('Album added to liked albums:', albumData.title);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding liked album:', error);
      return false;
    }
  }

  /**
   * Clear all storage (for debugging/reset purposes)
   */
  clearAllStorage() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage usage info
   */
  getStorageStats() {
    return {
      likedSongs: this.getLikedSongs().length,
      likedPlaylists: this.getLikedPlaylists().length,
      likedAlbums: this.getLikedAlbums().length
    };
  }
}

// Create global storage manager instance
window.storageManager = new StorageManager();

export default window.storageManager;