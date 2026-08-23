(function () {
  const root = document.querySelector("[data-reviews-carousel]");
  if (!root || typeof Swiper === "undefined") return;

  const videos = Array.from(root.querySelectorAll("[data-review-video]"));
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let carouselInView = false;
  let activeIndex = 0;

  const prepareVideo = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.controls = false;

    if ("disableRemotePlayback" in video) {
      video.disableRemotePlayback = true;
    }
  };

  const playVideo = (video) => {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const pauseVideo = (video) => {
    video.pause();
  };

  const syncVideoPlayback = () => {
    videos.forEach((video, index) => {
      const shouldPlay =
        !reduceMotion &&
        !document.hidden &&
        carouselInView &&
        index === activeIndex;

      if (shouldPlay) {
        playVideo(video);
      } else {
        pauseVideo(video);
      }
    });
  };

  videos.forEach(prepareVideo);

  new Swiper(root, {
    slidesPerView: 1.16,
    spaceBetween: 10,
    centeredSlides: true,
    speed: reduceMotion ? 0 : 420,
    grabCursor: true,
    watchSlidesProgress: true,
    breakpoints: {
      720: {
        slidesPerView: 1.18,
        spaceBetween: 22,
      },
      1100: {
        slidesPerView: 1.28,
        spaceBetween: 28,
      },
    },
    on: {
      init(instance) {
        activeIndex = instance.activeIndex;
        syncVideoPlayback();
      },
      slideChange(instance) {
        activeIndex = instance.activeIndex;
        syncVideoPlayback();
      },
    },
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        carouselInView = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35,
        );
        syncVideoPlayback();
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    observer.observe(root);
  } else {
    carouselInView = true;
    syncVideoPlayback();
  }

  document.addEventListener("visibilitychange", syncVideoPlayback);
})();
