# Assets — v0.6.2

- `assets/dice/d4.png`, `d6.png`, `d8.png`, `d10.png`, `d12.png`, `d20.png`: PNGs-base originais fornecidos e preservados byte a byte.
- O D6 recebe apenas redução visual por CSS (`scale(.82)`).
- `assets/ui/chat-icon.png`: cópia derivada do D20 original com margem transparente adicional para impedir clipping no ícone do Owlbear; o asset de dado usado nas rolagens não é substituído.
- Chat não redesenha os dados e não usa fallback SVG.
- Webfonts são instaladas pelo usuário com `prepare_fonts.py` antes do deploy.
