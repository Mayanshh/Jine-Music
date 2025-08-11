class Navigation {
  constructor() {
    this.initializeBackButton();
    this.initializeSeeAllButton();
  }

  initializeBackButton() {
    const backButton = document.getElementById('back-to-home-btn');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.navigateHome();
      });
    }
  }

  initializeSeeAllButton() {
    const seeAllBtn = document.getElementById('see-all-btn');
    if (seeAllBtn) {
      seeAllBtn.addEventListener('click', () => {
        window.location.href = "src/pages/album.html";
      });
    }
  }

  navigateHome() {
    // Navigate back to home page
    window.location.href = '../../index.html';
  }
}

export function initializeNavigation() {
  return new Navigation();
}