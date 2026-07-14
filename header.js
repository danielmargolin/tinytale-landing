(function () {
  const header = document.querySelector(".header");
  if (!header) return;

  const toggleScrolled = () => {
    header.classList.toggle("header--scrolled", window.scrollY > 8);
  };

  window.addEventListener("scroll", toggleScrolled, { passive: true });
  toggleScrolled();

  const menuButton = header.querySelector(".header-menu-button");
  const menu = header.querySelector(".header-menu");
  if (!menuButton || !menu) return;

  const closeMenu = () => {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    menu.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
  };

  const toggleMenu = () => {
    if (menu.hidden) openMenu();
    else closeMenu();
  };

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (event) => {
    if (menu.hidden) return;
    if (menuButton.contains(event.target) || menu.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.matchMedia("(min-width: 900px)").matches) closeMenu();
    },
    { passive: true }
  );
})();
