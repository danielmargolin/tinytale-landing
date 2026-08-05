(function () {
  const root = document.querySelector(".books-marquee");
  if (!root) return;

  const track = root.querySelector(".books-marquee__track");
  if (!track) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function createBookItem(book) {
    const item = document.createElement("figure");
    item.className = "books-marquee__item";

    const img = document.createElement("img");
    img.className = "books-marquee__cover";
    img.src = book.cover;
    img.alt = book.description
      ? book.description
      : book.author
        ? `ספר מאת ${book.author}`
        : "כריכת ספר";
    img.loading = "lazy";
    img.decoding = "async";
    item.appendChild(img);

    if (book.author) {
      const caption = document.createElement("figcaption");
      caption.className = "books-marquee__author";
      caption.textContent = book.author;
      item.appendChild(caption);
    }

    return item;
  }

  function buildGroup(books) {
    const group = document.createElement("div");
    group.className = "books-marquee__group";
    track.appendChild(group);

    const minWidth = root.offsetWidth + 1;
    while (group.scrollWidth < minWidth) {
      for (const book of books) {
        group.appendChild(createBookItem(book));
      }
    }

    group.remove();
    return group;
  }

  function setupMarquee(books) {
    if (!books.length) return;

    const group = buildGroup(books);
    track.replaceChildren(group);

    if (reducedMotion) return;

    const clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);

    const pixelsPerSecond = 48;
    const duration = track.scrollWidth / 2 / pixelsPerSecond;
    track.style.setProperty("--marquee-duration", `${duration}s`);
  }

  fetch("authors-books.json")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load authors-books.json");
      return response.json();
    })
    .then((books) => {
      setupMarquee(books);

      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => setupMarquee(books), 150);
      });
    })
    .catch(() => {});
})();
