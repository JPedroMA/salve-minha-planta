# 🚀 Guia de Deploy — Salve Minha Planta (Dokploy)

Do zero até o app no ar com HTTPS e deploy automático, usando o Dokploy já instalado na VPS.

Tempo total estimado: **~15 minutos**.

---

## 0. Pré-requisitos (já prontos)

- ✅ VPS com Dokploy: **https://dokploy.polaryeti.com** (IP `164.163.9.195`)
- ✅ Código no GitHub: **https://github.com/JPedroMA/salve-minha-planta**
- Domínio `polaryeti.com` com acesso ao painel de DNS

---

## 1. Chave da API do Gemini (grátis) — 5 min

1. Acesse **https://aistudio.google.com/apikey** e faça login com sua conta Google
2. Clique em **"Create API key"**
3. Copie a chave (começa com `AIza...`) — vamos colar no Dokploy no passo 3

> Free tier: ~1.500 análises por dia. **Custo: R$ 0.**
> Sem a chave o app roda em **modo demonstração** (resposta de exemplo) — dá pra fazer o deploy mesmo sem ela.

---

## 2. Criar o registro DNS — 2 min

No painel de DNS do `polaryeti.com`, crie um registro **A**:

| Tipo | Nome | Valor |
|---|---|---|
| A | `salve` | `164.163.9.195` |

Isso cria **https://salve.polaryeti.com** apontando pra VPS. É esse endereço que o Dokploy usa pra emitir o certificado HTTPS.

Teste (pode demorar alguns minutos pra propagar):

```bash
ping salve.polaryeti.com
```

---

## 3. Criar o app no Dokploy — 5 min

1. Abra **https://dokploy.polaryeti.com** e faça login
2. Menu lateral → **Projects** → **Create Project** → nome: `Salve Minha Planta`
3. Dentro do projeto → **Create Resource** → **Application**
4. Em **Git provider**: escolha **GitHub** (ou "Others/Public repository") e cole a URL do repo:
   `https://github.com/JPedroMA/salve-minha-planta`
   - Branch: `main`
5. **Build type**: `Dockerfile` (o Dockerfile do repo já faz o build multi-stage)
6. **Port**: `3000`
7. Aba **Environment Variables** → adicionar:
   - Nome: `GEMINI_API_KEY` · Valor: sua chave do passo 1
8. Clique em **Deploy**

Acompanhe o build nos logs do Dokploy (primeiro build leva ~2–3 min).

---

## 4. Publicar o domínio com HTTPS — 2 min

1. No app, aba **Domains** → **Add Domain**
2. Tipo: **Production**, domínio: `salve.polaryeti.com`
3. Salve — o Traefik emite o certificado Let's Encrypt sozinho na primeira visita

Abra **https://salve.polaryeti.com** 🎉

---

## 5. Deploy automático

Com o app conectado ao GitHub, cada `git push` na `main` dispara rebuild + deploy no Dokploy automaticamente (webhook). Você só espera o build terminar nos logs.

## Dia a dia

- **Logs**: app no Dokploy → aba **Logs**
- **Status/health**: `https://salve.polaryeti.com/api/health` deve responder `{"status":"ok"}`
- **Redeploy manual**: botão **Redeploy** no app
- **Trocar a chave do Gemini**: aba **Environment Variables** → salvar → Redeploy

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Domínio não abre | DNS não propagou ainda | aguarde alguns minutos e teste de novo |
| Certificado não emite | registro A apontando errado | confira o passo 2 |
| Build falha | erro no Dockerfile/repo | veja a aba **Build Logs** no Dokploy |
| `bad gateway` | app não subiu ou porta errada | confira Port = 3000 e os logs |
| Análise sempre em demo | falta `GEMINI_API_KEY` | adicione a env var e redeploy |
