# 🔑 Como Adicionar Permissões D1 ao Token

## 📋 Passo a Passo para Atualizar o Token

### **Opção 1: Editar Token Existente (Se Possível)**

1. Acesse: **https://dash.cloudflare.com/profile/api-tokens**
2. Encontre seu token atual na lista
3. Clique no botão **"Edit"** (ícone de lápis)
4. Na seção **"Permissions"**, adicione:
   - **Account** → **D1** → **Edit** ✅
5. Clique **"Continue to summary"**
6. Clique **"Update Token"**
7. ✅ **Token atualizado!**

**⚠️ IMPORTANTE:** Nem todos os tokens podem ser editados. Se não aparecer o botão "Edit", siga a Opção 2.

---

### **Opção 2: Criar Novo Token (Recomendado)**

Se não conseguir editar o token existente, crie um novo com todas as permissões necessárias:

#### **Passo 1: Criar Token**

1. Acesse: **https://dash.cloudflare.com/profile/api-tokens**
2. Clique **"Create Token"**
3. Clique **"Create Custom Token"** (no final da página)

#### **Passo 2: Nomear o Token**

- **Token name**: `Cantina Control - Deploy Full`

#### **Passo 3: Configurar Permissões**

Na seção **"Permissions"**, adicione TODAS estas:

| Zone / Account | Resource | Permission |
|----------------|----------|------------|
| **Account** | **D1** | **Edit** ✅ |
| **Account** | **Workers Scripts** | **Edit** ✅ |
| **Account** | **Cloudflare Pages** | **Edit** ✅ |
| **Account** | **Account Settings** | **Read** ✅ |

**Como adicionar:**
1. Clique **"+ Add more"** para cada permissão
2. Selecione **"Account"** no dropdown
3. Escolha o recurso (D1, Workers Scripts, etc)
4. Escolha a permissão (Edit ou Read)

#### **Passo 4: Recursos da Conta**

Na seção **"Account Resources"**:
- Selecione: **Include** → **Adeniltondias@gmail.com's Account** ✅

#### **Passo 5: Criar e Copiar**

1. Clique **"Continue to summary"**
2. Revise as permissões
3. Clique **"Create Token"**
4. **COPIE O TOKEN** (só aparece uma vez!)
5. Guarde em local seguro

---

### **Passo 6: Atualizar no Genspark**

1. No Genspark, vá na aba **"Deploy"** (menu lateral)
2. **Cole o NOVO token** no campo "Cloudflare API Key"
3. Clique **"Save"**

---

## 🔍 **Verificar Permissões do Token**

Para confirmar que o token tem as permissões corretas:

```bash
# Verificar autenticação
npx wrangler whoami

# Testar criação de banco D1
npx wrangler d1 create test-permissions

# Se funcionar, você tem permissões corretas!
# Pode deletar o banco de teste:
npx wrangler d1 delete test-permissions
```

---

## 📊 **Resumo das Permissões Necessárias**

Para deploy completo do Cantina Control, você precisa:

✅ **D1** - Edit (criar/editar bancos)
✅ **Workers Scripts** - Edit (deploy workers)  
✅ **Cloudflare Pages** - Edit (criar/editar projetos)
✅ **Account Settings** - Read (ler configurações)

---

## 🎯 **Após Atualizar o Token**

Execute novamente o deploy automático:

```bash
cd /home/user/webapp
./deploy-auto.sh
```

Ou manualmente:

```bash
# 1. Criar banco D1
npx wrangler d1 create cantina-control-production

# 2. Copiar database_id e atualizar wrangler.jsonc

# 3. Aplicar migrations
npx wrangler d1 migrations apply cantina-control-production

# 4. Popular banco
npx wrangler d1 execute cantina-control-production --file=./seed.sql

# 5. Criar projeto Pages
npx wrangler pages project create cantina-control --production-branch main

# 6. Deploy
npm run build
npx wrangler pages deploy dist --project-name cantina-control

# 7. Configurar JWT
echo "cantina-control-secret-production-2024" | npx wrangler pages secret put JWT_SECRET --project-name cantina-control
```

---

## 🆘 **Se Ainda Não Funcionar**

### **Verificar Token no Dashboard:**

1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique no seu token
3. Role até **"Token Permissions Summary"**
4. Verifique se tem:
   - ✅ Account D1 Edit
   - ✅ Account Workers Scripts Edit
   - ✅ Account Cloudflare Pages Edit

### **Token Expirado?**

Se o token expirou:
1. Crie um novo seguindo os passos acima
2. Configure validade maior (1 ano recomendado)
3. Atualize no Genspark

---

## 🔗 **Links Úteis**

- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens
- **Documentação**: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- **Seu Repositório**: https://github.com/ajadiasdias/cantina-control

---

## ✨ **Template de Permissões (Copy-Paste)**

Use esta configuração ao criar o token:

```
Token Name: Cantina Control Deploy

Permissions:
├── Account - D1 - Edit
├── Account - Workers Scripts - Edit
├── Account - Cloudflare Pages - Edit
└── Account - Account Settings - Read

Account Resources:
└── Include: Adeniltondias@gmail.com's Account

IP Filtering: (deixar em branco)
TTL: 1 year
```

---

**Depois de atualizar o token, execute:**
```bash
cd /home/user/webapp && ./deploy-auto.sh
```

🚀 **Boa sorte!**
