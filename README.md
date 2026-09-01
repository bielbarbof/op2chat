# OP2 Playtest Chat v0.1.0

Chat comunitário **não oficial** para Owlbear Rodeo, desenhado para o **Ordem Paranormal RPG 2 — Playtest Alpha**.

## Testes de OP2

- Teste = dado do atributo + dado da perícia.
- DT padrão 7, editável.
- Rolagem Alta (RA) e Rolagem Baixa (RB) exibidas separadamente.
- Sucesso crítico quando dois ou mais dados mostram o mesmo valor 6+.
- Falha crítica quando todos os dados mostram 1.
- Ajustes de passo d4 → d6 → d8 → d10 → d12 → d20.
- Até quatro dados no teste.
- Dados extras manuais para Ajuda, habilidades e situações especiais.
- Quando quatro dados são rolados, a interface soma os três maiores como conveniência de mesa e deixa isso explícito no registro.

## Integração com as fichas

Quando **OP2 Playtest Fichas** está instalado e o jogador possui um sobrevivente atribuído:

- o chat usa o nome e a cor daquele personagem;
- exibe seus três atributos e vinte perícias;
- consome bônus preparados como Foco Mental, Foco Emocional, Avaliação e Ímpeto;
- uma falha de Executor pode preencher automaticamente Ímpeto;
- rolagens feitas diretamente pela ficha aparecem no histórico do chat.

## Histórico persistente no Owlbear

O Room Metadata do Owlbear tem limite total de 16 kB, insuficiente para um histórico completo. Por isso a extensão usa uma arquitetura híbrida **inteiramente dentro do Owlbear**:

- as mensagens recentes ficam espelhadas no Room Metadata;
- o histórico completo é dividido em blocos e salvo como itens de texto invisíveis na Scene ativa;
- esses itens são salvos junto da cena pelo Owlbear e sincronizados entre os participantes;
- quando o mestre troca de cena durante a sessão, o histórico em memória é replicado para a nova cena.

Isso permite que o histórico sobreviva a troca de navegador/computador ao retornar à sala e à cena salva. Como o SDK não oferece um banco arbitrário ilimitado ligado à conta, o histórico completo é tecnicamente armazenado nas cenas do Owlbear, e não em um banco global independente de cena.

## Chat livre

Além dos testes de OP2, existe um rolador simples para d4, d6, d8, d10, d12 e d20, útil para dano e tabelas. O comando `/r 2d6+1` também funciona.

## Importante

Esta extensão não substitui o Playtest Alpha. Regras que ainda não foram publicadas não são inventadas. É uma ferramenta comunitária não oficial e sem afiliação com a Jambô Editora ou a equipe de Ordem Paranormal.
