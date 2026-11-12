# bikrambhattarai.com

Source for my portfolio: <https://bikrambhattarai.com>

It is a Jekyll site, built by GitHub Pages on every push to `main`. No build step to run and nothing to deploy by hand.

## Layout

| Path | What lives there |
|:--|:--|
| `index.html` | Home page |
| `projects/` | Work index and the vehicle weight case study |
| `articles/` | Articles index |
| `_posts/` | One Markdown file per article |
| `_data/projects.yml` | Text for every project on the site |
| `_data/crash.json` | Numbers behind the case study charts, taken from the project's output tables |
| `_data/elsewhere.yml` | Links to posts made on LinkedIn, X or Facebook |
| `_layouts/`, `_includes/` | Page templates, header, footer and figures |
| `assets/css/site.css` | All styles, light and dark |
| `assets/js/charts.js` | Small SVG chart helpers (dot plot, line chart), no libraries |
| `assets/js/crash.js` | Charts for the case study |

## Write an article

Add a file to `_posts/` named `YYYY-MM-DD-title.md`:

```markdown
---
title: Your title here
description: One or two sentences. Shown in lists and in link previews.
tags: [statistics]
---

Start writing here.
```

Commit it and it is live in about a minute. The date and the web address come from the file name. Add `published: false` to keep a draft out of sight. Images go in `assets/posts/`.

The page at `/write/` has one-click shortcuts for all of this.

## List a post made somewhere else

Add an entry to `_data/elsewhere.yml` with the date, where it was posted, a title and the link. It appears on the Articles page under "Posted elsewhere".

## Run it locally

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>. The `Gemfile` uses the `github-pages` gem, so the local build matches the live one.

## Charts

The charts are plain SVG drawn by `assets/js/charts.js`. Each one has a table of its numbers underneath, follows the light or dark theme, responds to hover and arrow keys, and stays still for visitors who ask for reduced motion.

## Typefaces

Archivo and Source Serif 4, both under the SIL Open Font License, served from `assets/fonts/`.
