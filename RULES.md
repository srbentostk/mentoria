# Regras de Trabalho

1. Antes de criar ou alterar qualquer arquivo, revisar o conteúdo existente para evitar duplicação ou regressões.
2. Registrar cada avanço ou ajuste relevante no arquivo PROGRESS.md, mantendo as seções de "Feito", "Pendências" e "Próximos passos" atualizadas.
3. Preservar placeholders sensíveis (chaves Firebase, PlayFab, webhooks) até receber valores definitivos, documentando onde preencher.
4. Priorizar comentários claros apenas quando necessários para orientar futuras integrações (manter o código direto e funcional).
5. Validar dependências entre scripts antes de editar (firebase-init.js deve ser carregado antes dos módulos que o utilizam).
