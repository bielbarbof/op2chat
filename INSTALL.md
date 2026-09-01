# Instalação / atualização — v0.5.1 Recovery

1. Substitua os arquivos do repositório da extensão Chat pelos deste pacote.
2. Confira `FONT_SETUP.md` antes do deploy.
3. Faça commit/push e aguarde o redeploy do serviço.
4. Manifest de produção previsto: `https://op2chat.onrender.com/manifest.json`.
5. No Owlbear Rodeo, mantenha o mesmo manifest para atualizar a extensão existente.

O Chat continua usando `com.op2.playtest/state-v1` para ler atribuições/efeitos compartilhados com Fichas e mantém as chaves de histórico da linha anterior.
