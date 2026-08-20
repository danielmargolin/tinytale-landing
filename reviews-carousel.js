(function () {
  const root = document.querySelector("[data-reviews-carousel]");
  if (!root) return;

  const card = root.querySelector("[data-review-card]");
  const body = root.querySelector("[data-review-body]");
  const media = root.querySelector("[data-review-media]");
  const video = root.querySelector("[data-review-video]");
  const quoteEl = root.querySelector("[data-review-quote]");
  const nameEl = root.querySelector("[data-review-name]");
  const prevButton = root.querySelector("[data-review-prev]");
  const nextButton = root.querySelector("[data-review-next]");

  if (!card || !body || !quoteEl || !nameEl || !prevButton || !nextButton)
    return;

  const reviews = [
    {
      quote:
        '"מאז שקיבלנו את הספר, היא מבקשת שנקרא אותו כמעט כל ערב. היא ממש התרגשה לראות את עצמה בתוך הסיפור, והאיורים יצאו פשוט מקסימים!"',
      name: "טניה, אמא של גאיה (בת 3)",
      video: "videos/book1.mp4",
    },
    {
      quote:
        '"הספר יצא ממש יפה. היא ישבה ודפדפה בו שוב ושוב, וכל פעם שהיא קלטה שזאת היא באיור היא ישר חייכה וקראה לנו לראות"',
      name: "אוריה ו, אבא של ב (בן 5)",
    },
    {
      quote:
        '"תקשיבו, היא פשוט עפה על הספר! בהתחלה היא לא הבינה איך היא נכנסה לתוך הסיפור, ואז עברה עמוד עמוד וחיפשה את עצמה בכל האיורים. מאז כבר קראנו אותו איזה חמש פעמים"',
      name: "נועה ש, אמא של ת (בת 5)",
    },
  ];

  let index = 0;
  let isAnimating = false;
  let isInView = true;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const FADE_MS = reduceMotion ? 0 : 280;

  const syncVideoPlayback = () => {
    if (!video || !media) return;

    const shouldPlay =
      Boolean(reviews[index].video) && isInView && !reduceMotion;

    if (shouldPlay) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      return;
    }

    video.pause();
  };

  const renderReview = (review) => {
    quoteEl.textContent = review.quote;
    nameEl.textContent = review.name;

    const hasVideo = Boolean(review.video);
    card.classList.toggle("review-card--has-media", hasVideo);

    if (media) {
      media.hidden = !hasVideo;
    }

    if (video && hasVideo && video.getAttribute("src") !== review.video) {
      video.setAttribute("src", review.video);
      video.load();
    }

    syncVideoPlayback();
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const goTo = async (nextIndex) => {
    if (isAnimating || nextIndex === index) return;
    isAnimating = true;

    body.classList.add("is-leaving");
    if (media && !media.hidden) {
      media.classList.add("is-leaving");
    }
    await wait(FADE_MS);

    index = (nextIndex + reviews.length) % reviews.length;
    renderReview(reviews[index]);

    body.classList.remove("is-leaving");
    body.classList.add("is-entering");
    if (media) {
      media.classList.remove("is-leaving");
      if (!media.hidden) {
        media.classList.add("is-entering");
      }
    }
    // Force reflow so the entering state is applied before we fade in.
    void body.offsetWidth;
    body.classList.remove("is-entering");
    if (media) {
      media.classList.remove("is-entering");
    }

    await wait(FADE_MS);
    isAnimating = false;
  };

  prevButton.addEventListener("click", () => {
    void goTo(index - 1);
  });

  nextButton.addEventListener("click", () => {
    void goTo(index + 1);
  });

  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.controls = false;

    if ("disableRemotePlayback" in video) {
      video.disableRemotePlayback = true;
    }

    if (reduceMotion) {
      video.removeAttribute("autoplay");
      video.pause();
      video.currentTime = 0;
    }
  }

  if (video && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        isInView = entries.some((entry) => entry.isIntersecting);
        syncVideoPlayback();
      },
      { threshold: 0.35 },
    );
    observer.observe(card);
  }

  renderReview(reviews[index]);
})();
