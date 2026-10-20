# 📅 Guia de Configuração — Google Calendar API no Rian Coworker

Este guia orienta passo a passo como obter suas credenciais gratuitas da **Google Calendar API** no Google Cloud Console e conectá-las ao **Rian Coworker**.

---

## 🚀 Passo a Passo no Google Cloud Console

### 1. Criar ou Selecionar um Projeto
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Faça login com a conta Google cuja agenda você deseja integrar.
3. No topo da tela, clique no seletor de projetos e clique em **"Novo Projeto"** (ex: `Rian Coworker`).

---

### 2. Ativar a Google Calendar API
1. No menu lateral esquerdo (ou na barra de pesquisa no topo), procure por **"Google Calendar API"**.
2. Clique na **Google Calendar API** nos resultados.
3. Clique no botão azul **"Ativar"** (Enable).

---

### 3. Configurar a Tela de Permissão OAuth (OAuth Consent Screen)
1. No menu lateral esquerdo, vá em **APIs e Serviços** > **Tela de consentimento OAuth**.
2. Selecione o tipo de usuário:
   - Se possuir Google Workspace corporativo, pode escolher **Interno**.
   - Para contas pessoais `@gmail.com`, escolha **Externo** e clique em **Criar**.
3. Preencha as informações básicas:
   - **Nome do app**: `Rian Coworker`
   - **E-mail para suporte do usuário**: Seu e-mail
   - **E-mail do desenvolvedor**: Seu e-mail
4. Clique em **Salvar e Continuar**.
5. Na etapa de **Escopos (Scopes)**, adicione:
   - `.../auth/calendar` (Gerenciar agendas)
   - `.../auth/calendar.events` (Visualizar e editar eventos)
   - `.../auth/userinfo.email` (Ver seu endereço de e-mail)
6. Na etapa de **Usuários de Teste (Test Users)**:
   - Adicione o seu endereço de e-mail `@gmail.com` como usuário de teste.
   - **Múltiplas contas**: Se você for conectar mais de uma conta Google (ex: pessoal, trabalho, faculdade), adicione **todos os e-mails** que deseja conectar nesta lista de usuários de teste!
7. Conclua e salve.

---

### 4. Criar as Credenciais OAuth 2.0
1. No menu lateral, clique em **Credenciais** (Credentials).
2. Clique no botão superior **"+ Criar Credenciais"** > **ID do cliente OAuth** (OAuth client ID).
3. Em **Tipo de aplicativo**, escolha: **Aplicativo da Web** (Web application).
4. Dê um nome (ex: `Rian Coworker Local`).
5. Na seção **URIs de redirecionamento autorizados** (Authorized redirect URIs), clique em **"+ Adicionar URI"** e informe exatamente:
   ```
   http://localhost:3001/api/calendar/callback
   ```
6. Clique em **Criar**.
7. Uma janela exibirá seu **ID do cliente (Client ID)** e sua **Chave secreta do cliente (Client Secret)**.

---

## 🔑 Inserindo as Credenciais no Rian Coworker

Você pode configurar suas credenciais de duas formas:

### Opção 1: Pela Interface Web do Rian Coworker
1. Acesse o Rian Coworker no navegador (`http://localhost:3001`).
2. Acesse a página **Integrações** ou **Agenda**.
3. Clique em **"Configurar Google Calendar"**.
4. Cole o seu `Client ID` e `Client Secret` e clique em **Salvar**.
5. Clique no botão **"Conectar com Google"** e autorize o acesso na tela de login da sua conta.

### Opção 2: Pelo arquivo `config.json`
Abra o arquivo [`integrations/google-calendar/config.json`](file:///C:/Users/vilanova/Desktop/workspace/rian-coworker/integrations/google-calendar/config.json) e preencha:

```json
{
  "clientId": "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com",
  "clientSecret": "SUA_CHAVE_SECRETA_AQUI",
  "redirectUri": "http://localhost:3001/api/calendar/callback"
}
```

---

## ▶️ Como Iniciar o Servidor

Para rodar o assistente conectado à API do Google Calendar, execute no terminal da pasta do projeto:

```bash
node server.js
```

O servidor iniciará em `http://localhost:3001`.
A partir daí, ao criar ou sincronizar eventos, o Rian Coworker lerá e escreverá diretamente na sua agenda oficial do Google!
