# TEST REPORT — OP2 Playtest Chat v0.6.2

## Regressão funcional

- Sintaxe JavaScript de todos os módulos: aprovada.
- Núcleo de sanitização, merge, chunking e limite de mensagem: **4/4** verificações executadas nesta build.
- Funcionalidades v0.6.1 (rolador por ícones e limpeza global do Mestre) preservadas no código-base.

## Verificações específicas da v0.6.2

- Manifest em 0.6.2: aprovado.
- Manifest usa `assets/ui/chat-icon.png`: aprovado.
- Ícone possui margem transparente segura superior/inferior/lateral: aprovado.
- D4/D6/D8/D10/D12/D20 originais do Chat permanecem byte a byte iguais à v0.6.1.
- D6 em `.82`: aprovado.
- Girassol e Arpona Light/Regular/Medium/Bold declaradas: aprovado.
- Webfonts incorporadas em `fonts.css` sem dependência local: aprovado.
- Bloco CSS dos cards/notificações de rolagem comparado com a v0.6.1 e preservado: aprovado.
- Nenhum binário proprietário de fonte incluído no pacote distribuível.

## Integridade compartilhada

A bateria estática conjunta Fichas + Chat fechou em **33/33** verificações aprovadas antes do empacotamento.


## FONTES EMBUTIDAS — HOTFIX v0.6.2
Girassol e Arpona (Light, Regular e Bold) estão incorporadas diretamente em `fonts.css` como webfonts WOFF2, derivadas dos assets de fonte fornecidos pelo proprietário. O deploy não depende de fontes instaladas no dispositivo e não requer etapa local de instalação de fontes.
