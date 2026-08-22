(function () {
  const frame = document.querySelector(".books-picker-frame");
  const iframe = frame?.querySelector(".books-picker-frame__iframe");
  if (!frame || !iframe) return;

  let lastHeight = 0;
  /** @type {{ track: Element | null, link: Element | null, startX: number, startY: number, scrollStart: number, dragging: boolean } | null} */
  let gesture = null;
  let suppressClick = false;

  const DRAG_THRESHOLD_PX = 12;

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

  const activateTarget = (target) => {
    if (!target || target.closest(".carousel-arrow")) return;
    // Cover/perk links must leave the landing page, not navigate inside the iframe.
    if (target.tagName === "A" && target.href) {
      window.location.assign(target.href);
      return;
    }
    target.click();
  };

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

    const link = el.closest("a, button");
    const track = el.closest(".carousel-track");

    if (!track && !link) return;

    gesture = {
      track: track ?? null,
      link: link && !link.closest(".carousel-arrow") ? link : null,
      startX: event.clientX,
      startY: event.clientY,
      scrollStart: track?.scrollLeft ?? 0,
      dragging: false,
    };
  });

  frame.addEventListener("pointermove", (event) => {
    const el = hitTest(event.clientX, event.clientY);
    frame.style.cursor = el?.closest("a, button") ? "pointer" : "";

    if (!gesture?.track) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.dragging) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < DRAG_THRESHOLD_PX || absX <= absY * 1.25) return;
      gesture.dragging = true;
      frame.setPointerCapture?.(event.pointerId);
    }

    gesture.track.scrollLeft = gesture.scrollStart - dx;
    event.preventDefault();
  });

  const endGesture = () => {
    if (!gesture) return;

    const { dragging, link } = gesture;
    gesture = null;

    if (dragging) {
      suppressClick = true;
      return;
    }

    // Activate on pointerup — more reliable on mobile than waiting for click.
    if (link) {
      activateTarget(link);
      suppressClick = true;
    }
  };

  frame.addEventListener("pointerup", endGesture);
  frame.addEventListener("pointercancel", endGesture);

  frame.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (!isPickerDoc(pickerDoc())) return;
    const target = hitTest(event.clientX, event.clientY)?.closest("a, button");
    activateTarget(target);
  });
})();
