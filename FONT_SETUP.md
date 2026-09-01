# Fontes da v0.5.1 Recovery

A interface foi preparada para usar **webfonts servidas pelo próprio deploy** — não usa `local("Arpona")` e não depende de fonte instalada no dispositivo.

Os binários das fontes não fazem parte do pacote distribuível. Use as suas próprias cópias de `arpona.zip` e `Girassol.zip` antes do deploy:

```bash
python prepare_fonts.py --arpona /caminho/arpona.zip --girassol /caminho/Girassol.zip
```

O script usa somente a biblioteca padrão do Python e instala:

- `assets/fonts/arpona-light.otf`
- `assets/fonts/arpona-regular.otf`
- `assets/fonts/arpona-bold.otf`
- `assets/fonts/girassol-regular.ttf`

Depois disso, publique normalmente. O navegador baixará essas fontes como assets da extensão em Windows, macOS, Android e iOS.

Hierarquia visual:

- **Girassol**: CHAT, PERSONAGENS e nomes principais das fichas.
- **Arpona Bold**: botões, tags, ribbons, perfil, custos e controles.
- **Arpona Light**: descrições, mensagens e texto corrido.
- **Cards/rolador do Chat**: preservam a hierarquia tipográfica aprovada da v0.4.0 usando Arpona como webfont.
