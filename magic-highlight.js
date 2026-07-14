const STAR_COUNT = 3;
const STAR_PATH =
  "M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z";

const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function createRandomStar() {
  return {
    left: `${rand(-6, 92)}%`,
    top: `${rand(-22, 48)}%`,
    size: rand(7, 12),
    scaleDurationMs: rand(1100, 2400),
    rotateDurationMs: rand(1800, 4500),
    opacity: rand(35, 75) / 100,
  };
}

function createStarElement(star) {
  const starEl = document.createElement("span");
  starEl.className = "magic-star";
  starEl.style.left = star.left;
  starEl.style.top = star.top;
  starEl.style.width = `${star.size}px`;
  starEl.style.height = `${star.size}px`;
  starEl.style.opacity = String(star.opacity);
  starEl.style.animation = `magic-star-scale ${star.scaleDurationMs}ms ease forwards`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 512 512");
  svg.style.animation = `magic-star-rotate ${star.rotateDurationMs}ms linear infinite`;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", STAR_PATH);
  path.setAttribute("fill", "#504DF2");

  svg.appendChild(path);
  starEl.appendChild(svg);
  return starEl;
}

function initMagicHighlightText(container) {
  const starElements = [];

  function animateStar(index) {
    const star = createRandomStar();
    const newEl = createStarElement(star);

    if (starElements[index]) {
      starElements[index].replaceWith(newEl);
    } else {
      container.insertBefore(newEl, container.firstChild);
    }

    starElements[index] = newEl;
  }

  for (let index = 0; index < STAR_COUNT; index += 1) {
    animateStar(index);
  }

  for (let index = 0; index < STAR_COUNT; index += 1) {
    const initialDelayMs = rand(0, 1400);
    const repositionIntervalMs = rand(1800, 4200);

    setTimeout(() => {
      animateStar(index);
      setInterval(() => animateStar(index), repositionIntervalMs);
    }, initialDelayMs);
  }
}

document
  .querySelectorAll(".magic-highlight-text")
  .forEach(initMagicHighlightText);
