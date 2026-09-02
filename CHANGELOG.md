# Changelog

## 0.7.4

- Remove a reconstrução do histórico completo do caminho crítico de abertura do painel lateral.
- Registra a ação do Chat antes da hidratação de identidade e dos itens de histórico da cena.
- Usa geometria previamente aquecida e elimina a consulta de estado do popover no primeiro clique.
- Exibe o snapshot recente da sala imediatamente e sincroniza o histórico completo em segundo plano.
- Remove redimensionamento bloqueante da inicialização do painel e reduz consultas periódicas desnecessárias ao viewport.
- Mantém persistência, DT, rolagens, permissões e integração com Fichas sem alterar o formato dos dados.

## 0.7.3

- Substitui o Action Popover de Chat por um painel lateral persistente aberto através da API oficial de Popover do Owlbear Rodeo.
- O clique na ação da extensão passa a alternar entre abrir e fechar o painel.
- O painel usa altura disponível do viewport, permanece aberto ao interagir com a Room e adapta a largura para notebook, desktop e telas estreitas.
- Adiciona fechamento direto no cabeçalho do Chat sem alterar histórico, DT, rolagens ou persistência.

## 0.7.2

- Release de compatibilidade com Fichas v0.7.2; regras, DT, pool multidados, histórico e layout do Chat permanecem inalterados.

## 0.7.1

- Remove o selo comunitário do cabeçalho do Chat e aproveita o espaço liberado.
- Centraliza verticalmente perfil, lixeira, DT e botão de Ficha/Personagens em relação ao título CHAT.
- Atualiza os ribbons de perfil, incluindo Mestre, para a mesma família visual usada nas Fichas.

## 0.7.0

- DT atual da mesa adicionada ao cabeçalho do Mestre e sincronizada com a extensão de Fichas.
- Cards comuns só exibem sucesso ou falha quando existe DT definida; críticos continuam independentes da DT.
- Sucesso crítico e falha crítica receberam estados de fundo verde-escuro e vermelho-escuro.
- Rolador livre substituído por uma pool acumulativa de até quatro dados, com mistura e repetição de tipos.
- Card de teste passou a compartilhar a mesma implementação visual utilizada pelas Fichas.
- Cabeçalho passou a usar selo de perfil; o Mestre usa selo roxo e o botão de fichas passa a se chamar PERSONAGENS.
- Integração com Ímpeto permite registrar automaticamente falhas inequívocas quando a Ficha está instalada.

## 0.6.5

- Arpona SemiBold incorporada e aplicada no lugar dos antigos usos de Arpona Bold.
- Selo da Licença da Comunidade movido para o cabeçalho, à esquerda de CHAT.
- Área útil do histórico ampliada e popover dimensionado dinamicamente conforme o viewport do Owlbear.

## 0.6.4

- Equalização óptica dos dados e revisão de tipografia, assets, documentação e persistência.

## 0.6.3

- Base estável utilizada pelas releases seguintes.
