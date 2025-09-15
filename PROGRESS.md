# Progresso do Projeto

## Feito
- Repositório reinicializado com estrutura estática para "Jornada dos Poderes Digitais".
- Páginas principais criadas (index.html, auth.html, members.html) com layout responsivo e chamadas para ação.
- Folha de estilos global styles/main.css configurada com identidade visual neon espacial.
- Scripts modulares adicionados para Firebase, autenticação, PlayFab, missões, membros, onboarding, leads e recompensas.
- Catálogo base de missões, schema JSON e exemplo de missão de onboarding inseridos em data/.
- Regras mínimas de segurança do Firestore (firestore.rules) e Storage (storage.rules) definidas.
- Arquivo .gitignore adaptado para o escopo estático.
- Documentação de cada diretório adicionada (DIRECTORY.md) com versão e descrição de arquivos.

## Pendências
- Preencher placeholders sensíveis (Firebase, PlayFab, webhooks, URLs de checkout e materiais).
- Substituir assets provisórios por versões finais (assets/img/agent_mentor.png, assets/sfx/reward.mp3).
- Implementar fluxos pós-login nos scripts (comentários TODO) e validar integrações.
- Testar as regras de segurança no console Firebase antes do deploy no GitHub Pages.

## Próximos passos sugeridos
1. Configurar ambiente Firebase/PlayFab real e atualizar scripts/firebase-init.js e scripts/playfab.js.
2. Executar testes manuais dos formulários (lead, signup, envio de prova) em um ambiente de staging.
3. Preparar automações N8n e validar chamados dos webhooks {N8N_REMINDERS_WEBHOOK} e {N8N_PROOF_WEBHOOK}.

## Histórico de Versões
- 2025-09-15 — v0.1.0 — Estrutura inicial documentada e diretórios descritos.
