# Template book previews

The live pick-book site no longer uses this folder.

Standalone book screens are now **one dynamic page per variant**. They fetch templates from the production API and render whichever `id` is in the query string:

| Variant | App source | Page |
|---------|------------|------|
| Mobile | `app/story-creator/bookScreen.tsx` | `../mobile/template-book.html?id=<templateId>` |
| Desktop | `app/story-creator/bookScreen.dekstop.tsx` | `../desktop/template-book.html?id=<templateId>` |

Pick-book covers (`../app.js`) link there. Serve with `node story-creator-pick-book/serve.mjs`.

Files under `templates/`, `shells/`, and `out/` are leftover from the old per-template generator. Do not add new ones; edit the dynamic HTML pages instead.

Cursor agents: use the **generate-template-book-preview** skill.
