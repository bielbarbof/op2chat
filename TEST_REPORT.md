# Test Report — v0.1.0

Validações executadas antes do empacotamento:

- Sintaxe de todos os módulos JavaScript: OK.
- `manifest.json`: JSON válido e descrição abaixo de 128 caracteres.
- Referências locais de HTML/CSS/JS: 0 arquivos ausentes.
- Fusão, ordenação e deduplicação de histórico: OK.
- Fragmentação do histórico em blocos abaixo do limite de broadcast: OK.
- Espelho de mensagens recentes preparado para Room Metadata: OK.
- Teste OP2 retorna dados individuais, total, RA e RB: OK.
- Sucesso crítico e falha crítica implementados conforme o Playtest Alpha: OK.
- Escala d4/d6/d8/d10/d12/d20: OK.
- Até 4 dados por teste e máximo de 3 dados somados: OK.
- Integração com o estado compartilhado de OP2 Playtest Fichas: OK em teste lógico.
- Remoção de branding legado da campanha original: OK.

Pendente de validação real no Owlbear Rodeo:

- criação/atualização dos itens de texto invisíveis usados para os blocos de histórico;
- persistência após fechar/reabrir a sala em outro dispositivo;
- comportamento de sessões longas com muitos blocos de histórico;
- comportamento ao trocar de Scene durante uma sessão real.
