# Fontes — v0.6.2

Os binários de Arpona/Girassol não fazem parte do pacote distribuível. Antes do deploy, use suas próprias cópias:

```bash
python prepare_fonts.py --arpona /caminho/arpona.zip --girassol /caminho/Girassol.zip
```

O script instala:

- Arpona Light
- Arpona Regular
- Arpona Medium
- Arpona Bold
- Girassol Regular

A busca é feita pelo nome do arquivo dentro do ZIP, independentemente da pasta interna. Não há dependência de `local("Arpona")`.

## Hierarquia

- **Girassol**: CHAT e grandes títulos editoriais.
- **Arpona Bold/Medium**: controles, labels e ações.
- **Arpona Light**: mensagens, textos de apoio e entrada de texto.
- **Cards de rolagem**: composição tipográfica aprovada da v0.6.1 preservada.
