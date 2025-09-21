<!-- Documento mestre da iniciativa Q-Branch // AEGIS; mantenha sincronizado com progresso real. -->
# Plano Q-Branch // AEGIS

## Visao geral
A operacao Q-Branch // AEGIS busca introduzir salvaguardas avancadas na Jornada dos Poderes Digitais, ampliando a resiliencia de automacoes e a observabilidade de eventos criticos nas interfaces de membros e administracao.

## Objetivos principais
1. Monitorar e mitigar entradas maliciosas (HTML/JS) em toda a jornada.
2. Garantir que requisicoes externas sejam resilientes a falhas transitorias.
3. Padronizar utilitarios de frontend para acelerar novas features com menos risco.
4. Fornecer telemetria minima para auditar uso das novas protecoes.

## Escopo
- Criar bibliotecas de suporte (`scripts/lib/*.js`) consumidas pelos modulos existentes.
- Consolidar praticas de sanitizacao e fetch seguro.
- Documentar politicas e decisoes em `prompts/` para consumo por outras equipes e IA.
- Preparar terreno para integracao com futuros paineis de observabilidade.

## Stakeholders
- **Produtos**: Lideranca Jornada (priorizacao de entregas).
- **Engenharia**: Equipe Web Mentoria (implementacao e manutencao).
- **Seguranca**: Q-Branch (auditoria continua).
- **Suporte**: NOC Mentoria (alertas pos-deploy).

## Requisitos funcionais
- Fornecer helper `sanitizeHtml` que utilize DOMPurify com presets documentados.
- Criar fetch com timeout configuravel (default 8s) e backoff exponencial simples (ate 3 tentativas).
- Disponibilizar helpers DOM (`qs`, `qsa`, `on`, `delegate`) com assinatura consistente.
- Nova documentacao deve incluir checklists acionaveis para revisoes tecnicas.

## Requisitos nao funcionais
- Codigo totalmente modular (ES Modules).
- Zero dependencias extras alem de DOMPurify carregado via CDN.
- Cobertura manual: smoke tests nas paginas `index.html`, `auth.html`, `members.html` e `admin.html` utilizando os novos helpers.
- Respeitar estilo e linters ja praticados (sem bundlers adicionais).

## Integracoes e dependencias
- **Firebase**: nenhum ajuste direto, apenas consumo via camadas ja existentes.
- **PlayFab**: manter integracoes atuais, apenas assegurar que fetch/backoff esteja disponivel.
- **N8n**: prometer guidelines para rate-limit, com follow-up futuro para implementacao.
- **DOMPurify**: consumido como global `window.DOMPurify` (incluir nota nas paginas importadoras).

## Seguranca e conformidade
- Checklists no `SECURITY-POLICY.md` devem ser revisados a cada release.
- Sanitizacao obrigatoria antes de injetar HTML vindo de usuario.
- Registrar evidencias de testes em `CHANGELOG.md`.
- Minimizar logging de PII durante telemetria; armazenar so UID e hash de sessao.

## Cronograma proposto
| Fase | Periodo | Entregas |
| ---- | ------- | -------- |
| Planejamento | 20-22/09/2025 | Alignment com produto, revisao de riscos |
| Implementacao Wave 1 | 23-27/09/2025 | libs dom, fetcher, sanitize + refactors piloto |
| Implementacao Wave 2 | 30/09-04/10/2025 | Adaptacao dos modulos principais (members, auth, admin) |
| Auditoria e Rollout | 07-09/10/2025 | Smoke tests, checklist AEGIS, atualizacao PROGRESS.md |

## Backlog inicial
- [ ] Importar `sanitizeHtml` nos modulos que renderizam HTML dinamico.
- [ ] Substituir fetches diretas por `safeFetch` ou similar quando houver integracao critica.
- [ ] Documentar exemplo de uso das libs em `prompts/README.md` (follow-up).
- [ ] Definir logging minimo e pontos de telemetria (ex.: evento `sanitize:error`).

## Metricas de sucesso
- Manter numero de incidentes XSS reportados em zero.
- MTTR para falhas de webhook reduzido de 3h para 30min via backoff e logs.
- 100% dos modulos novos referenciando utilitarios de `scripts/lib/`.

## Riscos e mitigacao
- **Risco**: dependencia do DOMPurify nao carregada. Mitigacao: fallback seguro que lanca erro orientativo.
- **Risco**: falsa sensacao de seguranca com backoff. Mitigacao: alertas quando todas as tentativas falharem.
- **Risco**: divergencia documental. Mitigacao: revisao semanal da pasta `prompts/`.

## Validacao e rollout
1. Revisao cruzada por Q-Branch e engenharia.
2. Testes manuais seguindo `SECURITY-POLICY.md`.
3. Deploy gradual (staging -> producao) com checklist assinado.
4. Atualizacao do `CHANGELOG.md` apos conclusao de cada fase.

## Pendencias abertas
- Definir responsavel pelos alertas (NOC vs engenharia).
- Selecionar ferramenta de telemetria leve (PostHog? Logflare?).

---
Contato: `q-branch@poderesdigitais.com`
