(function () {
  const dialog = document.getElementById("legal-modal");
  if (!dialog) return;

  const titleEl = dialog.querySelector(".legal-modal__title");
  const bodyEl = dialog.querySelector(".legal-modal__body");
  const closeButton = dialog.querySelector(".legal-modal__close");
  const triggers = document.querySelectorAll("[data-legal-modal]");

  if (!titleEl || !bodyEl || !closeButton || !triggers.length) return;

  const cache = new Map();

  const appendTextWithBreaks = (parent, text) => {
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (index > 0) parent.appendChild(document.createElement("br"));
      parent.appendChild(document.createTextNode(line));
    });
  };

  const renderLegalContent = (data) => {
    bodyEl.replaceChildren();

    if (data.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.className = "legal-modal__subtitle";
      subtitle.textContent = data.subtitle;
      bodyEl.appendChild(subtitle);
    }

    if (data.intro) {
      const intro = document.createElement("p");
      intro.className = "legal-modal__intro";
      appendTextWithBreaks(intro, data.intro);
      bodyEl.appendChild(intro);
    }

    for (const section of data.sections || []) {
      const sectionEl = document.createElement("section");
      sectionEl.className = "legal-modal__section";

      const sectionTitle = document.createElement("h3");
      sectionTitle.className = "legal-modal__section-title";
      sectionTitle.textContent = section.title;
      sectionEl.appendChild(sectionTitle);

      const content = document.createElement("div");
      content.className = "legal-modal__section-content";

      for (const paragraph of section.content.split(/\n\n+/)) {
        const p = document.createElement("p");
        appendTextWithBreaks(p, paragraph.trim());
        content.appendChild(p);
      }

      sectionEl.appendChild(content);
      bodyEl.appendChild(sectionEl);
    }
  };

  const loadLegalContent = async (source) => {
    if (cache.has(source)) return cache.get(source);

    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to load ${source}`);

    const data = await response.json();
    cache.set(source, data);
    return data;
  };

  const closeModal = () => {
    if (!dialog.open) return;
    dialog.close();
    bodyEl.replaceChildren();
    titleEl.textContent = "";
  };

  const openModal = async (source) => {
    try {
      const data = await loadLegalContent(source);
      titleEl.textContent = data.title || "";
      renderLegalContent(data);
      dialog.showModal();
      bodyEl.scrollTop = 0;
      closeButton.focus();
    } catch (error) {
      console.error(error);
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const source = trigger.dataset.legalModal;
      if (source) openModal(source);
    });
  });

  closeButton.addEventListener("click", closeModal);

  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const clickedBackdrop =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (clickedBackdrop) closeModal();
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
})();
