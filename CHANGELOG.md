# Changelog — v0.5.1 Recovery

- Reconstruído sobre a v0.4.0, preservando o Chat aprovado e descartando as regressões visuais da v0.5.0.
- Tema do Mestre definido em roxo sem alterar as cores semânticas de sucesso/falha.
- Contraste do dado selecionado corrigido.
- Aba/painel TESTES, Teste Manual, DT, Base da Perícia, passo, Dado A e Dado B removidos.
- Botão superior alterado para ABRIR FICHA.
- Jogador abre diretamente a ficha atribuída; Mestre abre PERSONAGENS.
- Fluxo de retorno ao Chat restaurado por fechamento explícito dos modais.
- Rolador livre preserva a tipografia aprovada da v0.4.0 e usa D4/D6/D8/D10/D12/D20 originais.
- Cards de teste colocam o ícone do dado junto do valor rolado e omitem RA/RB/DT da apresentação.
- Sucesso crítico usa fundo verde escuro; falha crítica usa fundo vermelho escuro.
- Histórico completo é persistido em dados da cena do Owlbear, com cache recente em Room Metadata e sincronização por broadcast.
- Mensagens são sanitizadas na renderização; HTML enviado como texto não é executado.
- Fontes web configuradas por @font-face, sem dependência de local("Arpona").
- Somente os PNGs de dados fornecidos para a Recovery são referenciados; nenhum dado é redesenhado em runtime.
