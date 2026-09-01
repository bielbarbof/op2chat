# Assets — v0.6.2

- `assets/dice/d4.png`, `d6.png`, `d8.png`, `d10.png`, `d12.png`, `d20.png`: PNGs-base originais fornecidos e preservados byte a byte.
- O D6 recebe apenas redução visual por CSS (`scale(.82)`).
- `assets/ui/chat-icon.png`: cópia derivada do D20 original com margem transparente adicional para impedir clipping no ícone do Owlbear; o asset de dado usado nas rolagens não é substituído.
- Chat não redesenha os dados e não usa fallback SVG.
- Webfonts estão incorporadas em `fonts.css` e são servidas diretamente pelo deploy.


## FONTES EMBUTIDAS — HOTFIX v0.6.2
Girassol e Arpona (Light, Regular e Bold) estão incorporadas diretamente em `fonts.css` como webfonts WOFF2, derivadas dos assets de fonte fornecidos pelo proprietário. O deploy não depende de fontes instaladas no dispositivo e não requer etapa local de instalação de fontes.
