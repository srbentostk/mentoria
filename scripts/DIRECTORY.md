# scripts/

## Versão
- v0.1.0 — 2025-09-15 — Documentação básica dos módulos JS.

## Arquivos
- firebase-init.js: Inicialização do app Firebase, exportando auth, db, storage e provider Google.
- auth.js: Fluxos de login/cadastro, verificação de e-mail e criação de documentos de usuário.
- playfab.js: Conectores para autenticação CustomID e operações de estatística/moeda no PlayFab.
- missions.js: Carrega catálogo de missões (estático e Firestore) e renderiza lista pública.
- members.js: Regras da área de membros (perfil, progresso, envio de provas, sync PlayFab).
- onboarding.js: Utilitários da missão de onboarding e atualização de destaques na landing.
- lead.js: Captura leads do formulário e registra dados no Firestore/N8n.
- rewards.js: Feedback sonoro/visual quando stats são atualizados.

## Observações
- Garantir que firebase-init.js seja importado antes dos módulos dependentes.
- Revisar comentários TODO antes de liberar para produção.
