# 🔐 Guia de Segurança

## ⚠️ CRÍTICO: Chaves do Firebase

### 1. Regenere IMEDIATAMENTE
Se viu as chaves no git, **regenere** em:

Firebase Console → Projeto → ⚙️ Configurações → Chaves de API

### 2. Proteja com .env
```bash
# NUNCA commite .env!
# Use .env.example como template
cp .env.example .env.local
# Edite .env.local com valores reais
```

### 3. Configure Firebase Rules

Acesse: **Realtime Database → Rules**

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    
    "orders": {
      ".read": "root.child('users').child(auth.uid).child('role').val() in ['atendente', 'cozinha', 'admin']",
      ".write": "root.child('users').child(auth.uid).child('role').val() in ['atendente', 'admin']",
      "$orderId": {
        ".validate": "newData.hasChildren(['clienteInfo', 'items', 'status', 'createdAt'])"
      }
    },
    
    "insumos": {
      ".read": "root.child('users').child(auth.uid).child('role').val() in ['admin', 'estoque']",
      ".write": "root.child('users').child(auth.uid).child('role').val() in ['admin', 'estoque']"
    },
    
    "composicoes": {
      ".read": "auth != null",
      ".write": "root.child('users').child(auth.uid).child('role').val() in ['admin', 'estoque']"
    },
    
    "sessoes": {
      ".read": "$sessionId === root.child('sessoes').child($sessionId).child('userId').val() || root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null"
    },
    
    "auditLog": {
      ".read": "root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": false
    }
  }
}
```

### 4. CORS no Firebase

**Realtime Database → Rules:**
```json
{
  "rules": {
    // Adicione ao topo
    ".validate": "newData.isString() && newData.val().length > 0"
  }
}
```

### 5. Autenticação Firebase

1. **Ative Anonymous Auth**
    - Firebase Console → Authentication → Sign-in method
    - Ative "Anonymous"

2. **Ative Email/Password (FUTURO)**
    - Authentication → Sign-in method
    - Ative "Email/Password"

### 6. Checklist de Segurança

- ✅ Chaves regeneradas
- ✅ `.env` no `.gitignore`
- ✅ Firebase Rules configuradas
- ✅ HTTPS obrigatório (GitHub Pages)
- ✅ No console: sem logs sensíveis
- ✅ Senhas em hash (bcrypt backend FUTURO)
- ✅ Rate limiting implementado
- ✅ Audit log ativo

## 🔍 Monitoramento

### Verifique no Firebase Console

1. **Realtime Database → Rules**
    - Deve ter restrições

2. **Authentication → Users**
    - Veja usuários criados

3. **Database → Orders**
    - Verifique pedidos

4. **Realtime Database → Insights**
    - Monitore performance

## 🚨 Se Hacked

1. Regenere TODAS as chaves
2. Altere senhas do Firebase
3. Revise audit log
4. Force logout de todas as sessões
5. Notifique usuários

## 📞 Suporte

Abra issue: https://github.com/seuuser/ambrozio-paes-system/issues

