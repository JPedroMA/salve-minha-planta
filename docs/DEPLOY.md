# 🚀 Guia de Deploy — Salve Minha Planta

Do zero até o app no ar com HTTPS e deploy automático. Cada comando pode ser copiado e colado.

Tempo total estimado: **~40 minutos**.

---

## 0. Pré-requisitos

- Uma VPS (1–2 GB de RAM basta) com Ubuntu 22.04/24.04
- Um domínio seu (ex.: `seudominio.com`) com acesso ao painel de DNS
- Conta no GitHub
- Terminal com acesso SSH à VPS

> Nos comandos abaixo, troque sempre:
> - `SEU-USUARIO` → seu usuário do GitHub
> - `SEU-DOMINIO.com` → seu domínio real
> - `IP-DA-VPS` → o IP público da sua VPS

---

## 1. Chave da API do Gemini (grátis) — 5 min

1. Acesse **https://aistudio.google.com/apikey** e faça login com sua conta Google
2. Clique em **"Create API key"**
3. Copie a chave (começa com `AIza...`) e guarde — vamos usá-la no passo 5

> Free tier: ~1.500 análises por dia, mais que suficiente. **Custo: R$ 0.**

---

## 2. Criar o repositório no GitHub — 5 min

No site do GitHub:

1. Clique em **New repository**
2. Nome: **`salve-minha-planta`** (exatamente assim — o nome entra na URL da imagem do deploy)
3. Visibilidade: **Private** ou **Public** (Public fica melhor pro portfólio/LinkedIn)
4. Clique em **Create repository** (sem README, sem .gitignore — tudo já existe aqui)

No seu computador, na pasta do projeto:

```bash
cd caminho/para/salve-minha-planta

git init
git add .
git commit -m "feat: app de diagnóstico de plantas com IA (Next.js + Gemini)"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/salve-minha-planta.git
git push -u origin main
```

> 💡 Se pedir login, use um **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens) no lugar da senha.

O primeiro push vai disparar o GitHub Actions — e o build vai **falhar** no deploy (ainda não configuramos a VPS). Normal! Volte depois do passo 5 e rode de novo.

---

## 3. Apontar o DNS — 5 min

No painel de DNS do seu domínio, crie um registro **A**:

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A | `salve` | `IP-DA-VPS` | auto |

Isso cria `salve.seudominio.com` apontando pra sua VPS.

> O Caddy usa esse endereço pra emitir o certificado HTTPS automaticamente (Let's Encrypt) — sem isso o HTTPS não funciona.

Teste (pode demorar alguns minutos pra propagar):

```bash
ping salve.seudominio.com
```

Se responder com o IP da VPS, está pronto.

---

## 4. Preparar a VPS — 10 min

Conecte-se à VPS:

```bash
ssh root@IP-DA-VPS
```

Instale o Docker (script oficial — instala Docker + Compose plugin):

```bash
curl -fsSL https://get.docker.com | sh
```

Confirme:

```bash
docker --version
docker compose version
```

Libere as portas 80 e 443 no firewall (se estiver usando ufw):

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow OpenSSH
ufw enable
```

Crie a pasta do app:

```bash
mkdir -p /opt/salve-minha-planta
```

---

## 5. Primeiro deploy — 10 min

Ainda na VPS, baixe os arquivos de configuração do repositório:

```bash
cd /opt/salve-minha-planta
curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/salve-minha-planta/main/docker-compose.prod.yml -o docker-compose.prod.yml
curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/salve-minha-planta/main/Caddyfile -o Caddyfile
```

Crie o `.env` (substitua os valores):

```bash
cat > .env <<'EOF'
IMAGE=ghcr.io/SEU-USUARIO/salve-minha-planta:latest
DOMAIN=salve.seudominio.com
GEMINI_API_KEY=SUA-CHAVE-AQUI
EOF
```

Faça login no GitHub Container Registry pra poder baixar a imagem (se o repo for **private**):

```bash
echo SEU-TOKEN-GITHUB | docker login ghcr.io -u SEU-USUARIO --password-stdin
```

*(token precisa da permissão `read:packages`; se o repo for public, pode pular)*

Suba o app:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Verifique:

```bash
docker compose -f docker-compose.prod.yml ps
docker logs salve-minha-planta --tail 20
```

Abra no navegador: **https://salve.seudominio.com** 🎉

> O Caddy emite o certificado HTTPS sozinho na primeira visita — pode levar ~30s.

---

## 6. Deploy automático (CI/CD) — 5 min

Pra cada `git push` virar deploy automático, o GitHub Actions precisa acessar a VPS via SSH.

**6.1. Na VPS — criar chave de deploy** (se já não tiver uma):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy
```

Copie a **última linha exibida** (é a chave privada).

**6.2. No GitHub — cadastrar os secrets:**

Repo → **Settings → Secrets and variables → Actions → New repository secret** (repetir 3 vezes):

| Nome | Valor |
|---|---|
| `VPS_HOST` | `IP-DA-VPS` |
| `VPS_USER` | `root` (ou seu usuário) |
| `VPS_SSH_KEY` | a chave privada copiada acima |

**6.3. Testar:** repo → **Actions → Build & Deploy → Run workflow**, ou simplesmente:

```bash
git commit --allow-empty -m "chore: test deploy" && git push
```

Acompanhe em **Actions**. Se terminar com `Deploy OK`, o pipeline está completo:

```
git push → build da imagem → publica no GHCR → SSH na VPS → pull + up → healthcheck
```

---

## 7. Dia a dia

```bash
# ver status
ssh root@IP-DA-VPS "cd /opt/salve-minha-planta && docker compose -f docker-compose.prod.yml ps"

# ver logs em tempo real
ssh root@IP-DA-VPS "docker logs -f salve-minha-planta"

# reiniciar
ssh root@IP-DA-VPS "cd /opt/salve-minha-planta && docker compose -f docker-compose.prod.yml restart"

# atualizar manualmente (sem CI)
ssh root@IP-DA-VPS "cd /opt/salve-minha-planta && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"
```

Trocar a chave do Gemini depois: edite `/opt/salve-minha-planta/.env` na VPS e reinicie.

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Certificado não emite | DNS ainda não propagou | aguarde e acesse de novo; confira o registro A |
| `bad gateway` na URL | app não subiu | `docker logs salve-minha-planta` |
| CI falha no deploy | secrets errados / VPS offline | confira os 3 secrets e rode o workflow de novo |
| 502 intermitente | app reiniciando | `docker compose ... ps` mostra `(unhealthy)`? veja os logs |
| Imagem não baixa (private repo) | sem login no GHCR | passo 5, login do ghcr.io |
