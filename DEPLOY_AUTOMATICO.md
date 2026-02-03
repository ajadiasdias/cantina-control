# 🤖 Deploy Automático - Cantina Control

## ✅ Status Atual

### GitHub: ✅ CONCLUÍDO
- **Repositório**: https://github.com/ajadiasdias/cantina-control
- **Branch**: main
- **Status**: Código enviado com sucesso!

### Cloudflare: ⏳ AGUARDANDO CONFIGURAÇÃO
- **API Key**: Pendente

---

## 🔑 Passo 1: Configurar Cloudflare API Key

### **Obter API Token:**

1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em **"Create Token"**
3. Use o template **"Edit Cloudflare Workers"** ou crie custom com:
   - **Permissions**:
     - Account - Cloudflare Pages - Edit
     - Account - D1 - Edit
   - **Account Resources**: Include - All accounts
4. Clique **"Continue to summary"**
5. Clique **"Create Token"**
6. **COPIE o token** (só aparece uma vez!)

### **Configurar no Genspark:**

1. Vá para a aba **"Deploy"** (menu lateral)
2. Cole o token no campo Cloudflare API Key
3. Clique **"Save"**

---

## 🚀 Passo 2: Executar Deploy Automático

Após configurar a API key, execute estes comandos:

### **2.1 Criar Banco D1**

```bash
npx wrangler d1 create cantina-control-production
```

**IMPORTANTE**: Copie o `database_id` que aparece no resultado!

### **2.2 Atualizar wrangler.jsonc**

Cole o database_id no arquivo:

```bash
# Substitua YOUR-DATABASE-ID pelo ID copiado
sed -i 's/"database_id": "local-db-for-development"/"database_id": "YOUR-DATABASE-ID"/' wrangler.jsonc
git add wrangler.jsonc
git commit -m "Update database_id for production"
git push
```

### **2.3 Aplicar Migrations**

```bash
npx wrangler d1 migrations apply cantina-control-production
```

### **2.4 Popular Banco com Dados**

```bash
npx wrangler d1 execute cantina-control-production --file=./seed.sql
```

### **2.5 Criar Projeto Pages**

```bash
npx wrangler pages project create cantina-control --production-branch main
```

### **2.6 Deploy!**

```bash
npm run build
npx wrangler pages deploy dist --project-name cantina-control
```

### **2.7 Configurar JWT_SECRET**

```bash
npx wrangler pages secret put JWT_SECRET --project-name cantina-control
```

Quando pedir, digite:
```
cantina-control-secret-production-2024
```

### **2.8 Configurar D1 Binding**

**Via Dashboard (Recomendado):**
1. Acesse: https://dash.cloudflare.com
2. Workers & Pages → cantina-control
3. Settings → Functions → D1 database bindings
4. Add binding:
   - Variable name: `DB`
   - D1 database: `cantina-control-production`
5. Save

**Via CLI (Alternativa):**
```bash
npx wrangler pages project bind --database DB --database-name cantina-control-production cantina-control
```

---

## 🎯 Comandos Completos (Copy-Paste)

Se você já tem a API key configurada, execute tudo de uma vez:

```bash
cd /home/user/webapp

# 1. Criar banco D1
echo "Criando banco D1..."
npx wrangler d1 create cantina-control-production

# Aguarde e copie o database_id, depois continue:

# 2. Aplicar migrations
echo "Aplicando migrations..."
npx wrangler d1 migrations apply cantina-control-production

# 3. Popular banco
echo "Populando banco..."
npx wrangler d1 execute cantina-control-production --file=./seed.sql

# 4. Criar projeto Pages
echo "Criando projeto Pages..."
npx wrangler pages project create cantina-control --production-branch main

# 5. Build
echo "Building..."
npm run build

# 6. Deploy
echo "Deploying..."
npx wrangler pages deploy dist --project-name cantina-control

# 7. Configurar JWT
echo "Configurando JWT_SECRET..."
echo "cantina-control-secret-production-2024" | npx wrangler pages secret put JWT_SECRET --project-name cantina-control

echo "✅ Deploy concluído!"
echo "Acesse: https://cantina-control.pages.dev"
echo ""
echo "⚠️ IMPORTANTE: Configure o D1 binding no dashboard!"
```

---

## 📋 Checklist de Deploy

```
✅ GitHub configurado
✅ Código enviado para GitHub
⏳ Cloudflare API Key configurada
⏳ Banco D1 criado
⏳ Database ID atualizado
⏳ Migrations aplicadas
⏳ Dados seed carregados
⏳ Projeto Pages criado
⏳ Deploy realizado
⏳ JWT_SECRET configurado
⏳ D1 binding configurado
⏳ Site acessível
```

---

## 🔗 Links Importantes

- **Repositório GitHub**: https://github.com/ajadiasdias/cantina-control
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens
- **Workers & Pages**: https://dash.cloudflare.com/?to=/:account/workers-and-pages

---

## 🆘 Troubleshooting

### Erro: "Authentication required"
**Solução**: Execute `npx wrangler login` primeiro

### Erro: "Project already exists"
**Solução**: Use `npx wrangler pages deploy dist --project-name cantina-control` direto

### Erro: "Database not found"
**Solução**: Verifique se o database_id no wrangler.jsonc está correto

---

## ✨ Após Deploy Bem-Sucedido

Seu site estará disponível em:
**https://cantina-control.pages.dev**

**Credenciais:**
- Email: `admin@cantina.com`
- Senha: `admin123`

---

## 🔄 Deploys Futuros (Automático)

Agora, toda vez que você fizer push:

```bash
git add .
git commit -m "Alterações"
git push
```

O Cloudflare detecta e faz deploy automático! 🎉

---

**Próximo passo**: Configure a Cloudflare API Key na aba Deploy e execute os comandos acima!
