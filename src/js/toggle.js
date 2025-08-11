
export function initializeToggle() {
  const sortingItems = document.querySelectorAll(".sorting-section ul li button");

  sortingItems.forEach(item => {
    item.addEventListener("click", () => {
      document.querySelector(".sorting-section ul li button.active")?.classList.remove("active");
      item.classList.add("active");
    });
  });

  const toggleBtns = document.querySelectorAll('.toggle-btn');

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
