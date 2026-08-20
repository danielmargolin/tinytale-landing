const TEMPLATES_API_URL =
  "https://tiny-tale-backend-production.up.railway.app/v1/templates?language=he";
const TEMPLATES_PROXY_URL = "/api/templates";
const TEMPLATES_LOCAL_URL = "./templates.json";
const TINYTALE_AUTHOR = "TinyTale";
const FALLBACK_COVER = "https://placehold.co/300x320.png";
const EMBED_MESSAGE_SOURCE = "tinytale-books-picker";

function isEmbedded() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function postEmbedMessage(payload) {
  if (!isEmbedded()) return;
  window.parent.postMessage(
    { source: EMBED_MESSAGE_SOURCE, ...payload },
    "*"
  );
}

function reportEmbedHeight() {
  const page = document.querySelector(".page");
  const sections = document.getElementById("sections");
  const height = Math.ceil(
    Math.max(
      page?.getBoundingClientRect().height ?? 0,
      sections?.scrollHeight ?? 0
    )
  );
  if (height <= 0) return;
  postEmbedMessage({ type: "resize", height });
}

function setupEmbedHost() {
  if (!isEmbedded()) return;

  document.documentElement.classList.add("is-embedded");

  const observer = new ResizeObserver(reportEmbedHeight);
  const page = document.querySelector(".page");
  const sections = document.getElementById("sections");
  if (page) observer.observe(page);
  if (sections) observer.observe(sections);

  window.addEventListener("load", reportEmbedHeight);
  reportEmbedHeight();
}

function preferMobilePreview() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function bookPreviewUrl(templateId) {
  const variant = preferMobilePreview() ? "mobile" : "desktop";
  return `./${variant}/template-book.html?id=${encodeURIComponent(templateId)}`;
}

const COPY = {
  tinyTaleSection: "סיפורי הבית",
  otherAuthorsSection: "מאת סופרים",
  benefitButton: "מגיעה לך הטבה",
  signUpUrl: "https://tinytaleapp.com/sign-up",
};

function isTinyTaleAuthor(authorName) {
  return authorName?.trim().toLowerCase() === TINYTALE_AUTHOR.toLowerCase();
}

function splitTemplates(templates) {
  const tinyTale = [];
  const other = [];
  for (const template of templates) {
    if (isTinyTaleAuthor(template.authorName)) tinyTale.push(template);
    else other.push(template);
  }
  return { tinyTale, other };
}

function createCover(template, { showAuthorName = true, coverScale = 1 } = {}) {
  const link = document.createElement("a");
  link.className = "cover";
  link.href = bookPreviewUrl(template.id);
  if (isEmbedded()) link.target = "_top";
  link.style.setProperty("--cover-scale", String(coverScale));
  link.setAttribute("aria-label", template.title);

  const media = document.createElement("div");
  media.className = "cover-media";

  const img = document.createElement("img");
  img.className = "cover-image";
  img.alt = template.title;
  img.loading = "lazy";
  img.src = template.cover_photo || FALLBACK_COVER;

  const pending = document.createElement("div");
  pending.className = "cover-pending";
  pending.textContent = "Loading";

  img.addEventListener("load", () => pending.remove());
  img.addEventListener("error", () => {
    pending.className = "cover-error";
    pending.textContent = "Error";
    img.src = FALLBACK_COVER;
  });

  media.append(img, pending);

  const titleBlock = document.createElement("div");
  titleBlock.className = "cover-title-block";

  if (template.title) {
    const title = document.createElement("p");
    title.className = "cover-title";
    title.textContent = template.title;
    titleBlock.appendChild(title);
  }

  if (showAuthorName && template.authorName) {
    const author = document.createElement("p");
    author.className = "cover-author";
    author.textContent = template.authorName;
    titleBlock.appendChild(author);
  }

  link.append(media, titleBlock);
  return link;
}

function createSectionHeader({ title, icon, accessory }) {
  const header = document.createElement("div");
  header.className = "section-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "section-header-title-group";

  if (icon) {
    const iconEl = document.createElement("span");
    iconEl.className = `section-icon section-icon--${icon}`;
    iconEl.setAttribute("aria-hidden", "true");
    const material = document.createElement("span");
    material.className = "material-icons";
    material.textContent = icon;
    iconEl.appendChild(material);
    titleGroup.appendChild(iconEl);
  }

  const heading = document.createElement("h2");
  heading.className = "section-title";
  heading.textContent = title;
  titleGroup.appendChild(heading);

  header.appendChild(titleGroup);
  if (accessory) header.appendChild(accessory);
  return header;
}

function createPerkButton() {
  const button = document.createElement("a");
  button.className = "perk-button";
  button.href = COPY.signUpUrl;
  if (isEmbedded()) button.target = "_top";
  button.setAttribute("aria-label", COPY.benefitButton);

  const icon = document.createElement("span");
  icon.className = "material-icons";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "redeem";

  const label = document.createElement("span");
  label.textContent = COPY.benefitButton;

  button.append(icon, label);
  return button;
}

function updateCarouselChrome(track, fadeLeft, fadeRight, arrowLeft, arrowRight) {
  // Measure overflow from child boxes so RTL scrollLeft differences
  // across browsers don't keep both arrows visible.
  const trackRect = track.getBoundingClientRect();
  let minLeft = trackRect.left;
  let maxRight = trackRect.right;

  for (const child of track.children) {
    const rect = child.getBoundingClientRect();
    minLeft = Math.min(minLeft, rect.left);
    maxRight = Math.max(maxRight, rect.right);
  }

  const showLeft = trackRect.left - minLeft > 1;
  const showRight = maxRight - trackRect.right > 1;

  fadeLeft.hidden = !showLeft;
  arrowLeft.hidden = !showLeft;
  fadeRight.hidden = !showRight;
  arrowRight.hidden = !showRight;
}

function createCarousel(templates, { showAuthorName, coverScale, verticalScrollEl }) {
  const carousel = document.createElement("div");
  carousel.className = "carousel";

  const track = document.createElement("div");
  track.className = "carousel-track";

  for (const template of templates) {
    track.appendChild(createCover(template, { showAuthorName, coverScale }));
  }

  const fadeLeft = document.createElement("div");
  fadeLeft.className = "carousel-fade carousel-fade--left";
  fadeLeft.hidden = true;

  const fadeRight = document.createElement("div");
  fadeRight.className = "carousel-fade carousel-fade--right";
  fadeRight.hidden = true;

  const arrowLeft = document.createElement("button");
  arrowLeft.type = "button";
  arrowLeft.className = "carousel-arrow carousel-arrow--left";
  arrowLeft.setAttribute("aria-label", "גלול שמאלה");
  arrowLeft.hidden = true;
  arrowLeft.innerHTML = '<span class="material-icons">chevron_left</span>';

  const arrowRight = document.createElement("button");
  arrowRight.type = "button";
  arrowRight.className = "carousel-arrow carousel-arrow--right";
  arrowRight.setAttribute("aria-label", "גלול ימינה");
  arrowRight.hidden = true;
  arrowRight.innerHTML = '<span class="material-icons">chevron_right</span>';

  const scrollByPage = (direction) => {
    const amount = (track.clientWidth || 200) * 0.8;
    // Positive left always moves toward the physical right.
    const delta = direction === "right" ? amount : -amount;
    track.scrollBy({ left: delta, behavior: "smooth" });
  };

  const bindArrow = (button, direction) => {
    const stop = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    // Capture early so cover <a> links underneath never see the interaction.
    for (const type of ["mousedown", "touchstart", "click"]) {
      button.addEventListener(type, stop, true);
    }

    // Scroll once per press; also stop propagation here.
    button.addEventListener(
      "pointerdown",
      (event) => {
        stop(event);
        if (event.button != null && event.button !== 0) return;
        scrollByPage(direction);
      },
      true
    );
  };

  bindArrow(arrowLeft, "left");
  bindArrow(arrowRight, "right");

  const refresh = () =>
    updateCarouselChrome(track, fadeLeft, fadeRight, arrowLeft, arrowRight);

  track.addEventListener("scroll", refresh, { passive: true });
  window.addEventListener("resize", refresh);

  // Nested horizontal ScrollView shouldn't eat vertical wheel/trackpad scrolls —
  // forward them to the parent GradientScrollView-equivalent.
  if (verticalScrollEl) {
    track.addEventListener(
      "wheel",
      (event) => {
        const absX = Math.abs(event.deltaX);
        const absY = Math.abs(event.deltaY);
        if (absY <= absX) return;

        event.preventDefault();
        event.stopPropagation();
        verticalScrollEl.scrollTop += event.deltaY;
      },
      { passive: false }
    );
  }

  // Covers load async and change scrollWidth — refresh arrow chrome after layout.
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(refresh);
    observer.observe(track);
    for (const child of track.children) observer.observe(child);
  }
  requestAnimationFrame(refresh);

  carousel.append(track, fadeLeft, fadeRight, arrowLeft, arrowRight);
  return carousel;
}

function createGrid(templates, { showAuthorName }) {
  const grid = document.createElement("div");
  grid.className = "grid";
  for (const template of templates) {
    grid.appendChild(createCover(template, { showAuthorName, coverScale: 1 }));
  }
  return grid;
}

function createSection({
  title,
  icon,
  templates,
  showAuthorName = true,
  horizontal = false,
  coverScale = 1,
  accessory = null,
  verticalScrollEl = null,
}) {
  if (!templates.length) return null;

  const section = document.createElement("section");
  section.className = "section";
  section.appendChild(createSectionHeader({ title, icon, accessory }));

  if (horizontal) {
    section.appendChild(
      createCarousel(templates, {
        showAuthorName,
        coverScale,
        verticalScrollEl,
      })
    );
  } else {
    section.appendChild(createGrid(templates, { showAuthorName }));
  }

  return section;
}

function setupScrollFades(scrollView) {
  const fadeTop = document.getElementById("fade-top");
  const fadeBottom = document.getElementById("fade-bottom");

  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollView;
    const canScroll = scrollHeight > clientHeight + 2;
    fadeTop.hidden = !(canScroll && scrollTop > 2);
    fadeBottom.hidden = !(
      canScroll && scrollTop < scrollHeight - clientHeight - 2
    );
  };

  scrollView.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  requestAnimationFrame(update);
}

async function fetchTemplates(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load templates from ${url} (${response.status})`);
  }
  const data = await response.json();
  return data.templates ?? [];
}

async function loadTemplates() {
  for (const url of [TEMPLATES_API_URL, TEMPLATES_PROXY_URL, TEMPLATES_LOCAL_URL]) {
    try {
      return await fetchTemplates(url);
    } catch {
      // try the next source
    }
  }
  throw new Error("Failed to load templates from all sources");
}

async function main() {
  setupEmbedHost();

  const sectionsEl = document.getElementById("sections");
  const scrollView = document.getElementById("scroll-view");

  try {
    const templates = await loadTemplates();
    const { tinyTale, other } = splitTemplates(templates);

    const houseSection = createSection({
      title: COPY.tinyTaleSection,
      icon: "home",
      templates: tinyTale,
      showAuthorName: false,
      horizontal: true,
      coverScale: 0.82,
      accessory: createPerkButton(),
      verticalScrollEl: isEmbedded() ? null : scrollView,
    });

    const authorsSection = createSection({
      title: COPY.otherAuthorsSection,
      icon: "star",
      templates: other,
      showAuthorName: true,
      horizontal: false,
    });

    sectionsEl.replaceChildren(
      ...[houseSection, authorsSection].filter(Boolean)
    );
    if (!isEmbedded()) setupScrollFades(scrollView);
    reportEmbedHeight();
  } catch (error) {
    const banner = document.createElement("div");
    banner.className = "error-banner";
    banner.textContent =
      "לא ניתן לטעון את רשימת הסיפורים. בדקו את חיבור הרשת ונסו שוב.";
    console.error(error);
    sectionsEl.replaceChildren(banner);
    reportEmbedHeight();
  }
}

main();
