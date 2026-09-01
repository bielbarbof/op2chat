# TEST REPORT — OP2 Playtest Chat v0.6.1

## Regressão da base v0.6.0

- Núcleo do Chat: **11/11**.
- Verificações estáticas/integridade compartilhadas: **53/53**.

## Testes específicos da v0.6.1

- Seis botões de dados presentes: aprovado.
- Botões usam somente ícones, sem labels visuais redundantes: aprovado.
- `aria-label` preservado para D4, D6, D8, D10, D12 e D20: aprovado.
- Lixeira visível para o Mestre: aprovado.
- Confirmação de limpeza: aprovado.
- Cancelar a confirmação preserva o histórico: aprovado.
- Confirmar a limpeza esvazia a interface imediatamente: aprovado.
- Backend exige papel de Mestre: aprovado.
- Persistência é limpa com `persist([])`: aprovado.
- Evento de histórico limpo é enviado para todos: aprovado.
- Cards de teste e rolagem livre comparados com a v0.6.0 e preservados: aprovado.
