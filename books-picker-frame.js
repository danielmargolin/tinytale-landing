(function () {
  const frame = document.querySelector(".books-picker-frame");
  const iframe = frame?.querySelector(".books-picker-frame__iframe");
  if (!frame || !iframe) return;

  let lastHeight = 0;
  let drag = null;
  let suppressClick = false;

  const pickerDoc = () => {
    try {
      return iframe.contentDocument;
    } catch {
      return null;
    }
  };

  const isPickerDoc = (doc) => Boolean(doc?.getElementById("sections"));

  const applyHeight = (height) => {
    const next = Math.ceil(Number(height));
    if (!Number.isFinite(next) || next <= 0 || next === lastHeight) return;
    lastHeight = next;
    iframe.style.height = `${next}px`;
  };

  const setPickerPassthrough = (enabled) => {
    iframe.style.pointerEvents = enabled ? "none" : "auto";
  };

  const hitTest = (clientX, clientY) => {
    const doc = pickerDoc();
    if (!doc) return null;
    const rect = iframe.getBoundingClientRect();
    return doc.elementFromPoint(clientX - rect.left, clientY - rect.top);
  };

  window.addEventListener("message", (event) => {
    if (event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== "tinytale-books-picker") return;
    if (data.type === "resize") applyHeight(data.height);
  });

  iframe.addEventListener("load", () => {
    const doc = pickerDoc();
    const picker = isPickerDoc(doc);
    setPickerPassthrough(picker);
    if (!picker) return;
    const page = doc.querySelector(".page");
    if (page) applyHeight(page.getBoundingClientRect().height);
  });

  // Vertical wheel hits this wrapper (iframe has pointer-events: none)
  // and scrolls the landing page natively. Forward horizontal pans to the carousel.
  // Keep this listener passive so it cannot delay native vertical scrolling.
  frame.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (!isPickerDoc(pickerDoc())) return;
      const track = hitTest(event.clientX, event.clientY)?.closest(
        ".carousel-track",
      );
      if (!track) return;
      track.scrollLeft += event.deltaX;
    },
    { passive: true },
  );

  frame.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !isPickerDoc(pickerDoc())) return;

    const el = hitTest(event.clientX, event.clientY);
    if (!el) return;

    const arrow = el.closest(".carousel-arrow");
    if (arrow) {
      arrow.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          button: 0,
          view: iframe.contentWindow,
        }),
      );
      return;
    }

    const track = el.closest(".carousel-track");
    if (!track) return;

    drag = {
      track,
      startX: event.clientX,
      startY: event.clientY,
      scrollStart: track.scrollLeft,
      moved: false,
    };
  });

  frame.addEventListener("pointermove", (event) => {
    const el = hitTest(event.clientX, event.clientY);
    frame.style.cursor = el?.closest("a, button") ? "pointer" : "";

    if (!drag) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
      drag.moved = true;
      frame.setPointerCapture?.(event.pointerId);
    }

    drag.track.scrollLeft = drag.scrollStart - dx;
    event.preventDefault();
  });

  const endDrag = () => {
    if (drag?.moved) suppressClick = true;
    drag = null;
  };

  frame.addEventListener("pointerup", endDrag);
  frame.addEventListener("pointercancel", endDrag);

  frame.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (!isPickerDoc(pickerDoc())) return;
    const target = hitTest(event.clientX, event.clientY)?.closest("a, button");
    if (!target || target.closest(".carousel-arrow")) return;
    // Cover/perk links must leave the landing page, not navigate inside the iframe.
    if (target.tagName === "A" && target.href) {
      window.location.assign(target.href);
      return;
    }
    target.click();
  });
})();
