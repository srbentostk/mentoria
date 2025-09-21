<!-- Guia vivo de boas praticas de codigo; revisar antes de abrir novas features. -->
# Regras de Codigo

## Principios gerais
- **DRY**: antes de escrever nova logica, pesquisar utilitarios existentes (principalmente em `scripts/` e `scripts/lib/`).
- Modularizar cada responsabilidade em ES Modules isolados; exportar funcoes puras sempre que possivel.
- Comentarios devem explicar o "por que" e nao o "como"; manter breves e objetivos.

## Utilidades centralizadas
- Utilizar `scripts/lib/dom.js` para seletores e binding de eventos.
- Utilizar `scripts/lib/fetcher.js` para chamadas HTTP com requisitos de timeout/backoff.
- Utilizar `scripts/lib/sanitize.js` antes de injetar HTML vindo de usuario ou fontes externas.

## Processo antes de criar metodos
1. Inspecionar `scripts/lib/` e modulos proximos para evitar duplicacao.
2. Avaliar se a nova funcao deve viver em `scripts/lib/` ou em modulos especificos.
3. Documentar uso e dependencia em markdown ou comentarios relevantes.

## Modularizacao e separacao de responsabilidades
- Agrupar funcoes relacionadas em arquivos dedicados sob `scripts/lib/` ou `scripts/modules/` (futuro).
- Evitar side-effects globais; preferir exportar funcoes ou objetos configuraveis.
- Manter assinaturas consistentes (promises retornando objetos ou `void`).

## Testes manuais e checklist
- Sempre testar cenarios de sucesso, erro e edge cases apos refactors.
- Atualizar `PROGRESS.md` com resultados relevantes.
- Revisar `SECURITY-POLICY.md` para garantir que itens obrigatorios foram atendidos.

## Guidelines de submissao
- Seguir Conventional Commits.
- Incluir referencia a planos relevantes dentro das descricoes de PR/commits.
- Solicitar revisao cruzada quando alterar fluxos sensiveis (auth, membros, admin).
