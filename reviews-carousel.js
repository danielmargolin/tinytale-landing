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
        '"מאז שקיבלנו את הספר, היא מבקשת שנקרא אותו כמעט כל ערב. היא ממש התרגשה לראות את עצמה בתוך הסיפור, והאיורים יצאו פשוט מקסימים!"',
      name: "מיכל כ, אמא של ג (בת 4)",
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
