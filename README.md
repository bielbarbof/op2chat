# OP2 Playtest Chat — v0.6.5

Este é um conteúdo não oficial, publicado sob a Licença da Comunidade de Ordem Paranormal.


Extensão gratuita de Chat para Owlbear Rodeo, integrada ao OP2 Playtest Fichas. Oferece mensagens, rolador livre, cards de testes, exclusão de mensagens, limpeza do histórico pelo Mestre e persistência do histórico da sala.

## Instalação

Hospede o conteúdo desta pasta em HTTPS e cadastre a URL do `manifest.json` no Owlbear Rodeo. Para abrir fichas diretamente pelo Chat, mantenha também a extensão OP2 Playtest Fichas instalada e hospedada no endereço configurado no projeto.

## Uso

Jogadores usam a identidade do personagem atribuído nas Fichas; o Mestre usa a identidade de Mestre. O Chat recebe testes feitos nas fichas e também permite rolagens livres de d4, d6, d8, d10, d12 e d20, com bônus opcional.

O histórico recente é mantido nos metadados da sala e o histórico completo é persistido em itens ocultos da cena, conforme a arquitetura já utilizada na v0.6.3.

## Compatibilidade e privacidade

- Desenvolvido para Owlbear Rodeo com SDK 3.1.0.
- O SDK é carregado pelo endereço público `esm.unpkg.com`; é necessária conexão de rede para esse carregamento.
- O código da extensão não vende nem envia mensagens ou estado de personagem para um serviço próprio; a persistência ocorre no ambiente do Owlbear.

## Créditos e licença

Ferramenta comunitária gratuita baseada no Playtest Alpha. Ordem Paranormal, seus personagens e materiais originais pertencem aos respectivos titulares. Consulte `COMMUNITY_LICENSE.txt` e `THIRD_PARTY_NOTICES.md` antes de redistribuir ou modificar esta extensão.
