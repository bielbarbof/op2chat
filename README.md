# OP2 Playtest Chat — v0.7.6

Este é um conteúdo não oficial, publicado sob a Licença da Comunidade de Ordem Paranormal.

Extensão gratuita de Chat para Owlbear Rodeo, integrada ao OP2 Playtest Fichas. Oferece mensagens, rolagens de testes com pools de até quatro dados, DT compartilhada controlada pelo Mestre, cards sincronizados e histórico persistente da sala.

Ao clicar na ação da extensão, o Chat abre como um painel lateral persistente no lado esquerdo da Room. O painel permanece visível durante a interação com o mapa e pode ser fechado pelo botão da extensão ou pelo botão de fechar no próprio Chat. A abertura do painel não aguarda a reconstrução do histórico completo da cena; as mensagens recentes aparecem primeiro e o restante é sincronizado em segundo plano.

## Instalação

Hospede o conteúdo desta pasta em HTTPS e cadastre a URL do `manifest.json` no Owlbear Rodeo. Para abrir e sincronizar fichas diretamente pelo Chat, mantenha também a extensão OP2 Playtest Fichas instalada.

## Uso

O Mestre pode definir ou limpar a DT atual da mesa no cabeçalho. A DT é compartilhada com as Fichas e permanece ativa até ser alterada. Sem DT, rolagens comuns ficam neutras; críticos continuam sendo reconhecidos.

No rolador, cada clique adiciona um dado à pool. É possível combinar d4, d6, d8, d10, d12 e d20, repetir tipos, remover unidades e usar bônus opcional. Testes usam no máximo quatro dados e somam no máximo os três maiores.

## Compatibilidade e privacidade

- Desenvolvido para Owlbear Rodeo com SDK 3.1.0.
- O SDK é carregado pelo endereço público `esm.unpkg.com`; é necessária conexão de rede para esse carregamento.
- O código da extensão não vende nem envia mensagens ou estado de personagem para um serviço próprio; a persistência ocorre no ambiente do Owlbear.

## Créditos e licença

Ferramenta comunitária gratuita baseada no Playtest Alpha. Ordem Paranormal, seus personagens e materiais originais pertencem aos respectivos titulares. Consulte `COMMUNITY_LICENSE.txt` e `THIRD_PARTY_NOTICES.md` antes de redistribuir ou modificar esta extensão.
