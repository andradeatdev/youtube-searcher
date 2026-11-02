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
| `duration:>10m` | vídeos por duração (veja [Duração](#duração)) |
| `type:music` | apenas músicas |
| `type:video` | tudo que não for música |
| `exclude-text:palavra` | oculta resultados por título/canal |
| `exclude-title:palavra` | oculta resultados por título |
| `exclude-channel:palavra` | oculta resultados por canal |
| `exclude-type:music` | oculta o tipo informado |

- A busca ignora maiúsculas/minúsculas e é por substring (exceto `type:`, que é exato).
- Use aspas para valores com espaço: `title:"parte um"`.
- Combine operadores: `channel:lofi exclude-title:"24/7"`.
- Repetir um operador é permitido e todas as ocorrências precisam casar: `exclude-text:live exclude-text:remix`.
- Texto fora dos operadores é tratado como `text:`.
- Um operador com valor inválido (por exemplo `duration:>` enquanto você ainda digita) é ignorado, em vez de esconder a lista inteira.

### Duração

Aceita uma comparação, um valor exato ou um intervalo:

| Exemplo | Busca |
|---|---|
| `duration:>10m` | mais de 10 minutos |
| `duration:<=5:00` | até 5 minutos |
| `duration:5m-10m` | entre 5 e 10 minutos |
| `duration:1h30m` | exatamente 1 hora e 30 minutos |
| `duration:90s` | exatamente 90 segundos |

- Operadores aceitos: `>`, `>=`, `<`, `<=`, `=` (padrão).
- Formatos aceitos: unidades `h`/`m`/`s` (`1h30m`), estilo relógio (`1:30:00`, `10:30`) e números puros, que contam como **minutos** (`duration:>20`).
- Vídeos sem duração, como transmissões ao vivo, ficam ocultos quando um filtro `duration:` está ativo.

### Exemplos

```text
lofi                              título ou canal contém "lofi"
channel:"daft punk" type:music    músicas desse canal
duration:<4m exclude-type:music   vídeos curtos que não são música
duration:5m-10m exclude-text:live entre 5 e 10 minutos, sem "live"
```

## Limitações

- Apenas páginas de playlist.
- Filtra somente os vídeos já renderizados na página; não carrega a playlist inteira.
- Vídeos carregados depois de uma busca, por exemplo ao rolar a página, continuam visíveis até a query ser editada.
- O YouTube muda o DOM com frequência, então os seletores podem quebrar.

## Licença

GPL-3.0 — © 2024-2026 hdyzen (andradeatdev). Veja [LICENSE](LICENSE).
