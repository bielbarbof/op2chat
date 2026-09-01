# Fontes — OP2 v0.5.0

A v0.5.0 não consulta mais `local("Arpona")` ou `local("Girassol")`, evitando que PC e celular renderizem interfaces diferentes.

- Girassol é carregada como webfont.
- Bitter é o fallback web consistente para a família de apoio.
- Para usar Arpona exatamente em todos os dispositivos, hospede seus WOFF2 licenciados em `assets/fonts/` com os nomes:
  - `arpona-light.woff2`
  - `arpona-regular.woff2`
  - `arpona-bold.woff2`

A extensão já aponta para esses caminhos. Os arquivos de fonte não fazem parte do pacote distribuído.
