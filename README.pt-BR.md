# Youtube - Playlist Searcher

[English](README.md) · **Português (BR)**

[![Instalar no Greasy Fork](https://img.shields.io/badge/Install-Greasy_Fork-670000?style=flat-square)](https://greasyfork.org/scripts/603324)
[![Versão no Greasy Fork](https://img.shields.io/greasyfork/v/603324?style=flat-square&label=version)](https://greasyfork.org/scripts/603324)
[![Instalações no Greasy Fork](https://img.shields.io/greasyfork/dt/603324?style=flat-square&label=installs)](https://greasyfork.org/scripts/603324)
[![Licença](https://img.shields.io/github/license/andradeatdev/youtube-searcher?style=flat-square&logo=gnu)](LICENSE)

Um script simples que adiciona uma barra de busca às páginas de playlist do YouTube e filtra os vídeos por título ou canal. Funciona com [Violentmonkey](https://violentmonkey.github.io/) e [Tampermonkey](https://www.tampermonkey.net/).

## Sintaxe de busca

Texto simples busca em título e canal. Os operadores restringem o resultado:

| Sintaxe | Busca em |
|---|---|
| `text:palavra` | título ou canal |
| `title:palavra` | apenas título |
| `channel:palavra` | apenas canal |
| `exclude-text:palavra` | oculta resultados por título/canal |
| `exclude-title:palavra` | oculta resultados por título |
| `exclude-channel:palavra` | oculta resultados por canal |

- A busca ignora maiúsculas/minúsculas e é por substring.
- Use aspas para valores com espaço: `title:"parte um"`.
- Combine operadores: `channel:lofi exclude-title:"24/7"`.
- Texto fora dos operadores é tratado como `text:`.

## Limitações

- Apenas páginas de playlist.
- Filtra somente os vídeos já renderizados na página; não carrega a playlist inteira.
- Vídeos carregados depois de uma busca, por exemplo ao rolar a página, continuam visíveis até a query ser editada.
- O YouTube muda o DOM com frequência, então os seletores podem quebrar.

## Licença

GPL-3.0 — © 2024-2026 hdyzen (andradeatdev). Veja [LICENSE](LICENSE).
