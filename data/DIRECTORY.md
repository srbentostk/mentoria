# data/

## Versão
- v0.1.0 — 2025-09-15 — Identificação dos arquivos de dados e schemas.

## Arquivos
- missions.json: Catálogo público base das missões (inclui onboarding e pós-venda).
- mission.schema.json: JSON Schema com estrutura de missão para validação.
- mission-onboarding-example.json: Exemplo concreto de missão de onboarding seguindo o schema.

## Observações
- Atualizar o catálogo sempre que novas missões forem liberadas e sincronizar com Firestore.
- Manter o schema compatível com a estrutura usada pelos scripts em scripts/missions.js.
