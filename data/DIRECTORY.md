# data/

## Versão
- v0.3.0 — 2025-09-15 — Catálogo alinhado ao novo schema de missões.

## Arquivos
- missions.json: Catálogo público base das missões (estrutura completa conforme schema v0.3).
- mission.schema.json: JSON Schema com estrutura de missão detalhada para validação.
- mission-onboarding-example.json: Exemplo concreto de missão de onboarding seguindo o schema.

## Observações
- Atualizar o catálogo sempre que novas missões forem liberadas e sincronizar com Firestore.
- Manter o schema compatível com a estrutura usada pelos scripts em scripts/missions.js.
