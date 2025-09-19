# scripts/

## Versão
- v0.3.0 — 2025-09-15 — Admin lite e schema de missões atualizados.

## Arquivos
- firebase-init.js: Inicialização do app Firebase, exportando auth, db, storage e provider Google.
- config.js: Resolve variáveis de ambiente a partir de window.__ENV__ (Firebase, PlayFab, webhooks).
- auth.js: Fluxos de login/cadastro, verificação de e-mail e criação de documentos de usuário.
- playfab.js: Conectores para autenticação CustomID e operações de estatística/moeda no PlayFab.
- missions.js: Carrega catálogo de missões (estático e Firestore) e renderiza lista pública.
- members.js: Regras da área de membros (perfil, progresso, envio de provas, sync PlayFab).
- onboarding.js: Fluxos da missão onboarding-5v14d (contador, provas, lembretes e destaques).
- rewards.js: Feedback sonoro/visual quando stats são atualizados e resgate de códigos secretos.
- lead.js: Captura leads do formulário e registra dados no Firestore/N8n.
- admin.js: Interface restrita para publicar missões via JSON no Firestore.

## Observações
- Garantir que firebase-init.js seja importado antes dos módulos dependentes.
- Revisar comentários TODO antes de liberar para produção.
