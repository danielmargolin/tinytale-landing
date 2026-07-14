(function () {
  const root = document.querySelector(".authors-marquee");
  if (!root) return;

  const track = root.querySelector(".authors-marquee__track");
  const sourceGroup = root.querySelector(".authors-marquee__group");
  if (!track || !sourceGroup) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion) return;

  const baseItems = [...sourceGroup.children].map((item) =>
    item.cloneNode(true),
  );

  function buildGroup() {
    const group = document.createElement("div");
    group.className = "authors-marquee__group";
    track.appendChild(group);

    const minWidth = root.offsetWidth + 1;
    while (group.scrollWidth < minWidth) {
      for (const item of baseItems) {
        group.appendChild(item.cloneNode(true));
      }
    }

    group.remove();
    return group;
  }

  function setupMarquee() {
    const group = buildGroup();
    const clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");

    track.replaceChildren(group, clone);

    const pixelsPerSecond = 48;
    const duration = track.scrollWidth / 2 / pixelsPerSecond;
    track.style.setProperty("--marquee-duration", `${duration}s`);
  }

  setupMarquee();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupMarquee, 150);
  });
})();
