# Relatório de testes — OP2 Playtest Chat v0.5.1 Recovery

## Resultado geral

**Candidata aprovada no QA local da Recovery.**

## Testes automatizados e estáticos

- Sintaxe de todos os módulos JavaScript: **OK**.
- Manifest v0.5.1 válido e descrição abaixo de 128 caracteres: **OK**.
- Chat não usa `localStorage`/`sessionStorage`: **OK**.
- Aba/painel TESTES e Teste Manual ausentes da UI/runtime: **OK**.
- RA/RB/DT ausentes da apresentação dos cards: **OK**.
- Histórico deduplica IDs e mantém ordem cronológica: **OK**.
- Chunking de histórico respeita o limite alvo por bloco: **OK**.
- Mensagens limitadas a 1800 caracteres e renderizadas com escape de HTML: **OK**.
- Entradas persistidas são normalizadas para formatos limitados de mensagem, teste e rolagem livre: **OK**.
- Comando `/r`, quando usado, aceita somente D4/D6/D8/D10/D12/D20 e quantidade compatível com o rolador, evitando assets inexistentes: **OK**.
- Tema do Mestre usa roxo, enquanto sucesso/falha/críticos mantêm cores semânticas próprias: **OK**.
- Botões do rolador, stepper, excluir e ABRIR FICHA usam contorno completo: **OK**.
- ABRIR FICHA: jogador -> personagem atribuído; Mestre -> PERSONAGENS: **OK por implementação auditada**.
- Fluxo de fechamento e retorno ao Chat: **OK por implementação auditada**.

## Persistência

- Atribuições/efeitos são lidos de `com.op2.playtest/state-v1`.
- Histórico recente fica em Room Metadata.
- Histórico completo é dividido em chunks persistidos como itens invisíveis/bloqueados da cena e sincronizado por broadcast.
- Não há dependência de armazenamento local do navegador.

## Integridade dos assets

Os PNGs D4/D6/D8/D10/D12/D20 do Chat foram comparados por SHA-256 com os seis arquivos originais fornecidos neste chat e são cópias byte a byte. O ícone do Chat usa o D20 original.

## QA visual

Foram revisadas renderizações do Chat em 450x800 e viewport mobile, além da tela PERSONAGENS integrada. Cards normais mantêm fundo neutro com tag semântica; cards críticos usam fundo verde/vermelho escuro. A tipografia do rolador e dos cards permanece na família usada pelo componente aprovado da v0.4.0.

## Smoke test do pacote distribuível

Foi feita uma cópia limpa do pacote de release, as fontes foram instaladas a partir dos ZIPs enviados neste chat usando `prepare_fonts.py`, todos os módulos JavaScript passaram em `node --check`, o `manifest.json` foi parseado novamente e todas as referências locais de imagens/fontes/retratos foram verificadas. Resultado: **0 referências ausentes**.
