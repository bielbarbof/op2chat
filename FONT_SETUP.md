# Fontes da v0.6.0 Definitiva

Os binários de Arpona/Girassol não fazem parte do pacote distribuível. Antes do deploy, use suas próprias cópias:

```bash
python prepare_fonts.py --arpona /caminho/arpona.zip --girassol /caminho/Girassol.zip
```

O script instala Arpona Light/Regular/Bold e Girassol Regular em `assets/fonts/` para uso como webfonts. Não há dependência de `local("Arpona")`.
