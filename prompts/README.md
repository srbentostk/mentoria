<!-- Mantem registro central de prompts e planos; revise sempre que adicionar artefatos. -->
# prompts workspace

## Proposito
- Centralizar prompts operacionais, planos e politicas que orientam automacoes e interacoes com IAs.
- Preservar contexto historico para revisoes (ver `CHANGELOG.md`) e auditorias tecnicas.

## Como usar
1. Antes de criar um novo prompt ou plano, validar se ja existe material similar.
2. Documentar objetivos, variaveis criticas e passos de validacao no arquivo correspondente.
3. Registrar decisoes ou alteracoes relevantes no `CHANGELOG.md` com data e responsaveis.
4. Revisar `SECURITY-POLICY.md` e `REGRAS-CODIGO.md` sempre que for elaborar instrucoes sensiveis.

## Convencao de nomes
- Pastas em maiusculas quando agruparem artefatos tematicos (ex.: `PLANOS/`).
- Arquivos com prefixo de data `YYYY-MM-DD` seguido de slug descritivo em minusculas.
- Sufixos indicam contexto (ex.: `-aegis` para iniciativas ligadas a seguranca).

## Exemplo rapido
- Nova operacao tatica -> `PLANOS/2025-09-22-operacao-mercurio.md`
- Prompt de revisao de codigo -> `auditoria-codigo.md`
- Atualizacao de politica -> acrescentar entrada em `CHANGELOG.md` e ajustar a politica correspondente.
