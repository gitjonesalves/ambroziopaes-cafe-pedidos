# ambroziopaes-cafe-pedidos# ☕ Sistema de Gerenciamento - Café Ambrózio Paes

Sistema web (SPA) para gerenciar operações de cafeteria com pedidos em tempo real, gestão de estoque e rastreamento completo.

## 🚀 Deploy Rápido

### Live
**URL:** https://seuuser.github.io/ambrozio-paes-system

### Local
```bash
# 1. Clone o repositório
git clone https://github.com/seuuser/ambrozio-paes-system.git
cd ambrozio-paes-system

# 2. Configure as variáveis de ambiente
cp .env.example .env.local

# 3. Edite .env.local com suas chaves Firebase
# IMPORTANTE: Regenere as chaves em Firebase Console

# 4. Abra no navegador (sem build necessário)
# Abra docs/index.html ou use um servidor local
python3 -m http.server 8000
# Acesse: http://localhost:8000/docs/
```

## 📋 Roles & Acesso

| Role | Acesso | Autenticação |
|------|--------|--------------|
| **Atendente** | Fazer pedidos | Nome (sem senha) |
| **Cozinha** | Preparar pedidos | Nenhuma |
| **Admin** | Relatórios, Estoque | Senha |
| **Estoque** | Gerenciar insumos | Senha + Role |

## 🔐 Segurança

- ✅ Sem dependências externas (vanilla JS)
- ✅ Credenciais protegidas via `.env`
- ✅ Firebase Rules configuradas
- ✅ Audit log completo
- ✅ Soft delete (nunca apaga dados)

## 📊 Estrutura de Dados
/orders            → Pedidos
/insumos           → Estoque
/composicoes       → Receitas dos itens
/usuarios          → Contas
/sessoes           → Logins ativas
/auditLog          → Histórico de ações

## 🛠️ Tech Stack

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Backend:** Firebase Realtime Database
- **Hospedagem:** GitHub Pages (gratuito)
- **Custo:** Apenas Firebase (plano gratuito)

## 📝 Arquivos Importantes

- `docs/index.html` - Entry point
- `docs/js/firebase-init.js` - Config Firebase
- `docs/config/menu.json` - Cardápio
- `SECURITY.md` - Guia de segurança
- `DEPLOY.md` - Instruções de deploy

## 🔄 Contribuindo

1. Faça fork
2. Crie branch: `git checkout -b feature/sua-feature`
3. Commit: `git commit -m "Add: sua feature"`
4. Push: `git push origin feature/sua-feature`
5. Pull Request

## 📧 Suporte

Contato: suporte@ambroziopaes.com

## 📄 Licença

MIT - Veja LICENSE.md