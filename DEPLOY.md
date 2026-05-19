# 🚀 Deploy no GitHub Pages

## 1️⃣ Criar Repositório

```bash
# Crie repo no GitHub: ambrozio-paes-system

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seuuser/ambrozio-paes-system.git
git push -u origin main
```

## 2️⃣ Configurar GitHub Pages

1. Vá para **Settings → Pages**
2. Source: `Deploy from branch`
3. Branch: `main`
4. Folder: `/docs`
5. Salve

**Aguarde 1-2 minutos**

## 3️⃣ Verificar Deploy

- URL pública: `https://seuuser.github.io/ambrozio-paes-system`
- Arquivo principal: `/docs/index.html`

## 4️⃣ Testar Localmente

```bash
# Opção 1: Python
python3 -m http.server 8000
# Acesse: http://localhost:8000/docs/

# Opção 2: Node
npx http-server docs/
# Acesse: http://localhost:8080/

# Opção 3: VS Code
# Instale Live Server extension
# Clique: Go Live (canto inferior direito)
```

## 5️⃣ Configurar .env Localmente

```bash
# Crie .env.local (NÃO COMMITAR)
VITE_FIREBASE_API_KEY=sua_chave_real
# ... resto das vars

# GitHub Pages usa .env.example como fallback
# Ou configure via GitHub Secrets (FUTURO)
```

## 6️⃣ Atualizar Site

```bash
# Faça alterações
git add .
git commit -m "Update: descrição"
git push origin main

# GitHub Pages atualiza automaticamente
# Pode levar 1-2 minutos
```

## 7️⃣ Domínio Customizado (OPCIONAL)

### Se tiver domínio próprio:

1. **GitHub Pages Settings → Custom domain**
    - Digite: `cafe.seudominio.com`
    - Cria arquivo CNAME

2. **Seu registrador de DNS**
    - CNAME: `seuuser.github.io`

3. **GitHub habilitará HTTPS automaticamente**

## 🔒 GitHub Secrets (FUTURO - Workflow)

Se quiser CI/CD automático:

1. **Settings → Secrets and variables → Actions**
2. **New repository secret**
3. Nome: `FIREBASE_API_KEY`
4. Valor: sua chave real
5. Repita para todas as variáveis

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        run: echo "Deploy automático"
```

## ✅ Checklist Final

- ✅ Repositório criado no GitHub
- ✅ `.gitignore` configurado
- ✅ `.env.example` adicionado
- ✅ GitHub Pages ativado (branch main, folder /docs)
- ✅ Arquivo CNAME se domínio customizado
- ✅ Tested em `https://seuuser.github.io/ambrozio-paes-system`
- ✅ Firebase Rules configuradas
- ✅ Dados de teste no Firebase

## 🐛 Troubleshooting

### GitHub Pages mostra 404
✅ Verificar: Settings → Pages → Source
✅ Pasta docs/ existe?
✅ Arquivo index.html em docs/?
✅ Aguarde 2 minutos após push

### Firebase offline
✅ Verificar .env.local existe
✅ Valores corretos em firebase-init.js
✅ Console mostra erros? Abra DevTools (F12)
✅ WiFi conectado?

### Senhas não funcionam
✅ Hash correto em Firebase?
✅ Rules permitem leitura?
✅ Usuário existe em /users?
