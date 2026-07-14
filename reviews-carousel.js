(function () {
  const root = document.querySelector("[data-reviews-carousel]");
  if (!root) return;

  const body = root.querySelector("[data-review-body]");
  const quoteEl = root.querySelector("[data-review-quote]");
  const nameEl = root.querySelector("[data-review-name]");
  const prevButton = root.querySelector("[data-review-prev]");
  const nextButton = root.querySelector("[data-review-next]");

  if (!body || !quoteEl || !nameEl || !prevButton || !nextButton) return;

  const reviews = [
    {
      quote:
        '"הילדה שלי לא מפסיקה לבקש לקרוא את הספר שלה שוב ושוב. האיורים מדהימים והסיפור מרגיש באמת אישי — כאילו נכתב במיוחד בשבילה."',
      name: "מיכל כ, אמא של ג (בת 4)",
    },
    {
      quote:
        '"סוף סוף מצאנו ספר שמתאים בדיוק לשלב שהבן שלנו נמצא בו. הקריאה המשותפת הפכה לרגע הכי ממתינים לו ביום."',
      name: "יוסי ל, אבא של א (בן 6)",
    },
    {
      quote:
        '"האיכות מרגישה כמו ספר שנקנה בחנות, רק שהוא שלנו. כל פעם שהבת שלי רואה את עצמה בעמודים, עיניה נוצצות."',
      name: "נועה ש, אמא של ת (בת 5)",
    },
  ];

  let index = 0;
  let isAnimating = false;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const FADE_MS = reduceMotion ? 0 : 280;

  const renderReview = (review) => {
    quoteEl.textContent = review.quote;
    nameEl.textContent = review.name;
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const goTo = async (nextIndex) => {
    if (isAnimating || nextIndex === index) return;
    isAnimating = true;

    body.classList.add("is-leaving");
    await wait(FADE_MS);

    index = (nextIndex + reviews.length) % reviews.length;
    renderReview(reviews[index]);

    body.classList.remove("is-leaving");
    body.classList.add("is-entering");
    // Force reflow so the entering state is applied before we fade in.
    void body.offsetWidth;
    body.classList.remove("is-entering");

    await wait(FADE_MS);
    isAnimating = false;
  };

  prevButton.addEventListener("click", () => {
    void goTo(index - 1);
  });

  nextButton.addEventListener("click", () => {
    void goTo(index + 1);
  });
})();
