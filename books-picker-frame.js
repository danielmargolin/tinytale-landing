(function () {
  const iframe = document.querySelector(".books-picker-frame__iframe");
  if (!iframe) return;

  const applyHeight = (height) => {
    const next = Math.ceil(Number(height));
    if (!Number.isFinite(next) || next <= 0) return;
    if (iframe.offsetHeight === next) return;
    iframe.style.height = `${next}px`;
  };

  window.addEventListener("message", (event) => {
    if (event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== "tinytale-books-picker") return;

    if (data.type === "resize") {
      applyHeight(data.height);
      return;
    }

    if (data.type === "wheel") {
      window.scrollBy(0, Number(data.deltaY) || 0);
    }
  });

  iframe.addEventListener("load", () => {
    try {
      const page = iframe.contentDocument?.querySelector(".page");
      if (page) applyHeight(page.getBoundingClientRect().height);
    } catch {
      // Cross-origin: height updates arrive via postMessage instead.
    }
  });
})();
