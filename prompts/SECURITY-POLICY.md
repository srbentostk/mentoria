<!-- Politica viva para revisar ameacas em prompts/planos; mantenha atualizada por seguranca. -->
# Politica de Seguranca para Artefatos de Prompting

## Checklist obrigatorio
- [ ] Confirmar contexto e superficie de ataque antes de compartilhar prompt
- [ ] Validar dependencias externas citadas (bibliotecas, SDKs, SaaS) quanto a CVEs recentes
- [ ] Requerer revisao por par tecnico antes de publicar prompts que acionam automacoes
- [ ] Registrar evidencias de teste no `CHANGELOG.md`

## Revisao de implementacoes
- Verificar se o plano descreve monitoramento e rollback seguro.
- Garantir que variaveis sensiveis estejam parametrizadas via ambiente, nunca em texto puro.
- Definir responsaveis por incidentes e janelas de resposta.

## Validacao de dependencias
- Utilizar scanners (ex.: `npm audit`, `pip-audit`) e anexar resumo nos registros.
- Mapear licencas e restricoes de uso derivadas dos componentes citados.

## Politica de CSP e CORS
- Recomendar CSP restritiva (`default-src 'self'` + dominios estritamente necessarios).
- Documentar requisitos de CORS incluindo metodos e cabecalhos permitidos.

## Sanitizacao e dados de entrada
- Exigir sanitizacao de HTML/markdown usando utilitarios em `scripts/lib/sanitize.js`.
- Definir como tratar uploads (tipos aceitos, limite de tamanho, varredura antivirus).

## Limitacao de uso
- Especificar limites de requisicao e estrategias de backoff.
- Minimizar coleta de dados pessoais; justificar cada campo e indicar prazo de retencao.

## Auditoria periodica
- Programar revisao trimestral desta politica.
- Registrar ajustes assinados no `CHANGELOG.md` com link para commit ou PR.
