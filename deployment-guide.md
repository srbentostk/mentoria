# Guia de Configuração e Deploy da Jornada dos Poderes Digitais



Este roteiro cobre os passos para preparar Firebase, PlayFab, N8n e o ambiente client-side para rodar o projeto.



## 1. Preparar variáveis de ambiente (Front-end)

1. Copie <code>env.example.js</code> para <code>env.js</code> dentro da raiz do projeto.

2. Preencha os campos:

   - <code>FIREBASE_API_KEY</code>, <code>FIREBASE_AUTH_DOMAIN</code>, <code>FIREBASE_PROJECT_ID</code>, <code>FIREBASE_STORAGE_BUCKET</code>

   - <code>PLAYFAB_TITLE_ID</code>

   - <code>N8N_REMINDERS_WEBHOOK</code>, <code>N8N_PROOF_WEBHOOK</code>, <code>N8N_REWARD_WEBHOOK</code>

   - <code>FORM_ACTION_URL</code>

3. **Nunca** comitar <code>env.js</code> (já está ignorado em <code>.gitignore</code>).

4. No ambiente de deploy, injete <code>window.__ENV__</code> com os mesmos valores antes de carregar os módulos JS (por exemplo, servir <code>env.js</code> com dados corretos).



## 2. Firebase

### 2.1 Criar projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) → “Adicionar projeto”.

2. Nomeie o projeto (ex.: <code>jornada-poderes-digitais</code>) e conclua o assistente.



### 2.2 Habilitar serviços

- **Authentication**: habilite e ative o provedor Email/Password (Google é opcional).

- **Firestore**: crie o banco no modo Production (região próxima do público-alvo).

- **Storage**: inicialize o bucket padrão.



### 2.3 Configuração web

1. Em “Configurações do projeto” → “Apps” → “Adicionar app Web”.

2. Copie as credenciais para preencher <code>env.js</code>.



### 2.4 Regras de segurança

1. Em Firestore → Regras, substitua pelo conteúdo de <code>firestore.rules</code>.

2. Em Storage → Regras, substitua pelo conteúdo de <code>storage.rules</code>.

3. Publique as regras.



### 2.5 Dados iniciais (opcional)

- Importar <code>data/missions.json</code> para a coleção <code>missions</code> (via <code>/admin.html</code> ou console).



## 3. PlayFab

1. Crie/acesse um título em [PlayFab](https://developer.playfab.com/).

2. Anote o <code>Title ID</code> e adicione em <code>env.js</code> (<code>PLAYFAB_TITLE_ID</code>).

3. Habilite, se necessário, a API para Custom ID.

4. Ajuste estatísticas/virtual currency conforme o projeto (ex.: criar a moeda <code>GC</code>).



## 4. N8n (Automação)

Prepare dois workflows principais:



### 4.1 Lembretes (<code>N8N_REMINDERS_WEBHOOK</code>)

- Endpoint HTTP que receba <code>{ uid, email, missionId, dueAt, ntfyTopic }</code>.

- Agende notificações diárias (D+1…D+14) via ntfy.sh ou outro canal.

- Interrompa o agendamento quando receber sinal de missão concluída.



### 4.2 Provas (<code>N8N_PROOF_WEBHOOK</code>)

- Endpoint multipart/form-data recebendo <code>{ uid, missionId, file, notes }</code>.

- Validar o arquivo (tipo/integração externa) e retornar JSON <code>{ ok: true, saleValidated: boolean }</code>.

- O front usa esse retorno para atualizar o progresso.



### 4.3 Recompensas (<code>N8N_REWARD_WEBHOOK</code>, opcional)

- Recebe <code>{ code }</code> e devolve payload personalizado (ex.: <code>{ html: "..." }</code>).

- Alternativa: servir JSON estático em <code>/codes/{code}.json</code>.



## 5. Área Administrativa (Claims e Permissões)

1. <code>admin.html</code> exige <code>request.auth.token.role === 'admin'</code> nas regras.

2. Atribua o custom claim a um usuário (via Admin SDK ou CLI Firebase):

       admin.auth().setCustomUserClaims(uid, { role: 'admin' });

3. Re-autenticar para as claims surtirem efeito.



## 6. Fluxo de Deploy (Front-end)

1. Servir os arquivos estáticos (<code>index.html</code>, <code>auth.html</code>, <code>members.html</code>, <code>admin.html</code>, assets e scripts).

2. Garantir que <code>env.js</code> é carregado antes dos módulos importados.

3. Opcional: usar pipeline (Parcel/Vite) apenas para bundle — limpar entradas nos HTMLs se for compilado.



## 7. Testes finais

- Cadastro/login (email + Google) e verificação de e-mail.

- Iniciar missão onboarding, enviar prova, receber lembretes.

- Admin publicar novas missões via <code>/admin.html</code>.

- Resgatar recompensas e tocar <code>reward.mp3</code>.

- Revisar console Firebase/PlayFab para confirmar dados.



Seguindo estas etapas, o projeto deverá funcionar end-to-end com Firebase, PlayFab e automações N8n integradas.



## 8. Q-Console (FX, cripto e modelos)



### 8.1 Fontes de cambio e cripto

- Os endpoints livres padrao sao [Frankfurter.dev](https://www.frankfurter-api/documentation) para cambio e [CoinGecko](https://www.coingecko.com/en/api) para cripto; ambos funcionam sem chave.

- Caso precise mudar provedores, atualize `data/providers.json` e informe a nova `base_url`. Tambem e possivel adicionar provedores com chave (ex.: AlphaVantage) desde que habilite CORS no servidor.

- Se o dashboard exibir indisponivel, confirme que a rede libera requisicoes `https` externas e que o dominio nao esta bloqueado por extensoes de privacidade.



### 8.2 Atualizar o diretorio de modelos

- O catalogo consome o arquivo `data/models.json`. Edite ou substitua o JSON para inserir novos modelos, contextos e precos sem tocar no JavaScript.

- Mantenha o formato (vendor, name, function, usd, context, whenToUse, limits). Estados colapsados serao atualizados automaticamente na UI.

- Quando houver APIs proprias para listar modelos, adapte `initModelDirectory` para chamar o endpoint e persistir em JSON como fallback.



### 8.3 Dicas de execucao local

- Sirva o projeto com um servidor estatico (`npx serve`, `python -m http.server`) para evitar bloqueios de CORS ao carregar JSON local.

- Durante QA, acompanhe o console do navegador: erros de rede em `qconsole.fx.js` ou `qconsole.crypto.js` indicam falta de acesso ao provedor configurado.

- Para ambientes offline, carregue arquivos CSV locais e converta para JSON em `data/` antes do build.

