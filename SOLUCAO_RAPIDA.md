# ⚠️ TOKEN PRECISA DE MAIS PERMISSÕES

## 🔴 Problema

O token atual não tem permissões para criar banco D1.

---

## ✅ SOLUÇÃO RÁPIDA: Criar pelo Dashboard

### **Passo 1: Criar Banco D1**

1. Acesse: https://dash.cloudflare.com
2. Menu lateral → **Workers & Pages**
3. Clique na aba **D1 SQL Database**
4. Clique **"Create database"**
5. Nome: `cantina-control-production`
6. Clique **"Create"**
7. **COPIE o database_id** (exemplo: `abc123-456-789`)

### **Passo 2: Atualizar GitHub**

1. Acesse: https://github.com/ajadiasdias/cantina-control
2. Abra arquivo: `wrangler.jsonc`
3. Clique no lápis (editar)
4. Encontre: `"database_id": "local-db-for-development"`
5. Substitua pelo ID copiado: `"database_id": "abc123-456-789"`
6. Clique **"Commit changes"**

### **Passo 3: Criar Tabelas**

1. No banco D1 criado, clique **"Console"**
2. Cole o SQL do arquivo `migrations/0001_initial_schema.sql`
3. Execute
4. Cole o SQL do arquivo `seed.sql`
5. Execute

### **Passo 4: Deploy**

1. **Workers & Pages** → **Create application** → **Pages**
2. **Connect to Git** → Selecione `cantina-control`
3. Configure:
   - Project: `cantina-control`
   - Branch: `main`
   - Build: `npm run build`
   - Output: `dist`
4. **Environment variables**: 
   - `JWT_SECRET` = `cantina-secret-2024`
5. **D1 bindings**:
   - Variable: `DB`
   - Database: `cantina-control-production`
6. **Save and Deploy**

---

## 🎯 Resultado

URL: **https://cantina-control.pages.dev**

Login: `admin@cantina.com` / `admin123`

---

## 📋 Checklist

```
□ Criar banco D1 no dashboard
□ Copiar database_id
□ Atualizar wrangler.jsonc no GitHub
□ Executar SQLs no console D1
□ Criar projeto Pages
□ Conectar GitHub
□ Configurar variáveis
□ Configurar D1 binding
□ Deploy
```

---

**Dashboard**: https://dash.cloudflare.com
**Repositório**: https://github.com/ajadiasdias/cantina-control
