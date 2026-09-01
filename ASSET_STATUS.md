# Assets — v0.6.0 Definitiva

- `assets/dice/d4.png`, `d6.png`, `d8.png`, `d10.png`, `d12.png`, `d20.png`: PNGs-base originais fornecidos.
- O D6 permanece byte a byte idêntico ao original e recebe apenas redução visual por CSS (`scale(.9)`).
- Chat não redesenha os dados e não usa fallback SVG.
- Webfonts são instaladas pelo usuário com `prepare_fonts.py` antes do deploy.
