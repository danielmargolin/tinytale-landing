import { initBooksPicker } from "./story-creator-pick-book/app.js";

const root = document.getElementById("books-picker");
if (root) {
  initBooksPicker(root, {
    mode: "inline",
    basePath: "story-creator-pick-book/",
  });
}
