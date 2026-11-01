# Youtube - Playlist Searcher

**English** · [Português (BR)](README.pt-BR.md)

[![Install on Greasy Fork](https://img.shields.io/badge/Install-Greasy_Fork-670000?style=flat-square)](https://greasyfork.org/scripts/603324)
[![Greasy Fork version](https://img.shields.io/greasyfork/v/603324?style=flat-square&label=version)](https://greasyfork.org/scripts/603324)
[![Greasy Fork installs](https://img.shields.io/greasyfork/dt/603324?style=flat-square&label=installs)](https://greasyfork.org/scripts/603324)
[![License](https://img.shields.io/github/license/andradeatdev/youtube-searcher?style=flat-square&logo=gnu)](LICENSE)

A userscript that adds a search bar to YouTube playlist pages and filters the videos already loaded on the page by title or channel. Works with [Violentmonkey](https://violentmonkey.github.io/) and [Tampermonkey](https://www.tampermonkey.net/).

## Install

1. Install a userscript manager ([Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/)).
2. Open [`src/script.user.js`](src/script.user.js) and install it.
3. Open any YouTube playlist. The search bar appears in the playlist header.

## Search syntax

Plain text matches title and channel. Operators narrow the result:

| Syntax | Matches |
|---|---|
| `text:word` | title or channel |
| `title:word` | title only |
| `channel:word` | channel only |
| `exclude-text:word` | hides title/channel matches |
| `exclude-title:word` | hides title matches |
| `exclude-channel:word` | hides channel matches |

- Matching is case-insensitive and substring-based.
- Quote values with spaces: `title:"part one"`.
- Combine operators: `channel:lofi exclude-title:"24/7"`.
- Text outside operators is treated as `text:`.

## Limitations

- Playlist pages only.
- Filters only the videos already rendered on the page; it does not load the full playlist.
- Videos loaded after a search, for example while scrolling, stay visible until the query is edited.
- YouTube changes its DOM often, so selectors may break.

## Development

- `src/script.user.js` contains the whole userscript; there is no build step.
- Run `bun install` and `bunx eslint .` to lint.

## License

GPL-3.0 — © 2024-2026 hdyzen (andradeatdev). See [LICENSE](LICENSE).
