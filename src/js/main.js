import jioSaavnAPI from './jiosaavn-api.js';
import { initializeNavigation } from './navigation.js';
import { initializeToggle } from './toggle.js';
import { initializeLyrics } from './lyrics.js';
import { initializePlayerControls } from './player-controls.js';
import { initializeSongNavigation, initializePlayerPage } from './song-navigation.js';
import { initializeSearch } from './search.js';
import { initializeContentLoader } from './content-loader.js';
import audioPlayer from './audio-player.js';
import './storage-manager.js';
import './like-manager.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing modules...');

  try {
    // Initialize storage and like manager first
    if (window.storageManager && window.likeManager) {
      console.log('Storage and like manager already initialized');
    } else {
      console.log('Waiting for storage manager...');
      setTimeout(() => {
        if (window.likeManager) {
          window.likeManager.updateAllLikeButtons();
        }
      }, 100);
    }

    initializeNavigation();
    initializeToggle();
    initializeLyrics();
    
    // Initialize player controls with delay for player pages
    const playerControls = initializePlayerControls();
    if (playerControls && window.location.pathname.includes('player.html')) {
      setTimeout(() => {
        playerControls.loadCurrentSong();
        playerControls.initializeLikeButton();
      }, 200);
    }
    
    initializeSongNavigation();
    initializePlayerPage();
    initializeSearch();
    initializeContentLoader();
    audioPlayer(); // Initialize the audio player

    // Initialize navbar like button
    const navbarLikeBtn = document.getElementById('navbarLikeBtn');
    if (navbarLikeBtn) {
      navbarLikeBtn.addEventListener('click', () => {
        // Navigate to album page and show liked songs
        localStorage.setItem('showLikedSongs', 'true');
        window.location.href = 'src/pages/album.html';
      });
    }

    // Update like buttons after content is loaded
    setTimeout(() => {
      if (window.likeManager) {
        window.likeManager.updateAllLikeButtons();
        console.log('Like buttons updated after content load');
      }
      
      // Additional update for player page
      if (window.playerControls && window.location.pathname.includes('player.html')) {
        window.playerControls.updateLikeButtonState();
      }
    }, 1000);

    console.log('All modules initialized successfully');
  } catch (error) {
    console.error('Error initializing modules:', error);
  }
});