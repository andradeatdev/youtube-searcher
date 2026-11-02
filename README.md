# Youtube - Playlist Searcher

**English** · [Português (BR)](README.pt-BR.md)

[![Install on Greasy Fork](https://img.shields.io/badge/Install-Greasy_Fork-670000?style=flat-square)](https://greasyfork.org/scripts/603324)
[![Greasy Fork version](https://img.shields.io/greasyfork/v/603324?style=flat-square&label=version)](https://greasyfork.org/scripts/603324)
[![Greasy Fork installs](https://img.shields.io/greasyfork/dt/603324?style=flat-square&label=installs)](https://greasyfork.org/scripts/603324)
[![License](https://img.shields.io/github/license/andradeatdev/youtube-searcher?style=flat-square&logo=gnu)](LICENSE)

A simple script that adds a search bar to YouTube playlist pages and filters the videos by title or channel. Works with [Violentmonkey](https://violentmonkey.github.io/) and [Tampermonkey](https://www.tampermonkey.net/).

## Search syntax

Plain text matches title and channel. Operators narrow the result:

| Syntax | Matches |
|---|---|
| `text:word` | title or channel |
| `title:word` | title only |
| `channel:word` | channel only |
| `duration:>10m` | videos by length (see [Duration](#duration)) |
| `type:music` | music only |
| `type:video` | everything that is not music |
| `exclude-text:word` | hides title/channel matches |
| `exclude-title:word` | hides title matches |
| `exclude-channel:word` | hides channel matches |
| `exclude-type:music` | hides the given type |

- Matching is case-insensitive and substring-based (except `type:`, which is exact).
- Quote values with spaces: `title:"part one"`.
- Combine operators: `channel:lofi exclude-title:"24/7"`.
- Repeating an operator is allowed and every occurrence must match: `exclude-text:live exclude-text:remix`.
- Text outside operators is treated as `text:`.
- An operator with an invalid value (for example `duration:>` while you are still typing) is ignored instead of hiding the whole list.

### Duration

Accepts a comparison, an exact value or a range:

| Example | Matches |
|---|---|
| `duration:>10m` | longer than 10 minutes |
| `duration:<=5:00` | up to 5 minutes |
| `duration:5m-10m` | between 5 and 10 minutes |
| `duration:1h30m` | exactly 1 hour 30 minutes |
| `duration:90s` | exactly 90 seconds |

- Supported operators: `>`, `>=`, `<`, `<=`, `=` (default).
- Supported formats: `h`/`m`/`s` units (`1h30m`), clock style (`1:30:00`, `10:30`) and plain numbers, which count as **minutes** (`duration:>20`).
- Videos without a duration, such as live streams, are hidden when a `duration:` filter is active.

### Examples

```text
lofi                              title or channel contains "lofi"
channel:"daft punk" type:music    music from that channel
duration:<4m exclude-type:music   short videos that are not music
duration:5m-10m exclude-text:live between 5 and 10 minutes, without "live"
```


## Limitations

- Playlist pages only.
- Filters only the videos already rendered on the page; it does not load the full playlist.
- Videos loaded after a search, for example while scrolling, stay visible until the query is edited.
- YouTube changes its DOM often, so selectors may break.

## License

GPL-3.0 — © 2024-2026 hdyzen (andradeatdev). See [LICENSE](LICENSE).
