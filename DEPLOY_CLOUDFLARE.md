# 🚀 Deploy Completo no Cloudflare Pages - Guia Passo a Passo

## 📌 Visão Geral do Processo

Vamos seguir estas etapas:
1. ✅ Criar conta no Cloudflare
2. ✅ Fazer upload do código no GitHub
3. ✅ Criar banco de dados D1 na produção
4. ✅ Criar projeto Cloudflare Pages
5. ✅ Conectar GitHub ao Cloudflare
6. ✅ Configurar variáveis de ambiente
7. ✅ Deploy!

---

## 📦 OPÇÃO 1: Deploy Via GitHub (Recomendado)

### **Passo 1: Baixar o Código do Projeto**

**Link de Download**: https://www.genspark.ai/api/files/s/7Aa90M4I

1. Clique no link acima
2. Baixe o arquivo `cantina-control-crud-completo.tar.gz`
3. Extraia o arquivo em seu computador

---

### **Passo 2: Criar Repositório no GitHub**

1. Acesse https://github.com
2. Faça login (ou crie conta gratuita)
3. Clique em **"New repository"** (botão verde)
4. Configure:
   - **Repository name**: `cantina-control`
   - **Description**: `Sistema de gerenciamento de tarefas para cantinas`
   - **Visibility**: Public (ou Private se preferir)
5. **NÃO marque** "Initialize with README"
6. Clique **"Create repository"**

---

### **Passo 3: Fazer Upload do Código**

#### Opção A: Via Interface Web (Mais Fácil)

1. No seu repositório recém-criado, clique em **"uploading an existing file"**
2. Arraste todos os arquivos da pasta extraída
3. Na mensagem de commit: `Initial commit - Cantina Control`
4. Clique **"Commit changes"**

#### Opção B: Via Git (Terminal)

```bash
# Navegue até a pasta extraída
cd /caminho/para/webapp

# Inicialize o git (se ainda não estiver)
git init

# Adicione todos os arquivos
git add .

# Faça o commit
git commit -m "Initial commit - Cantina Control"

# Conecte ao GitHub (substitua SEU-USUARIO e SEU-REPO)
git remote add origin https://github.com/SEU-USUARIO/cantina-control.git

# Envie o código
git branch -M main
git push -u origin main
```

---

### **Passo 4: Criar Conta no Cloudflare**

1. Acesse https://dash.cloudflare.com/sign-up
2. Crie conta gratuita com seu email
3. Confirme seu email
4. Faça login no dashboard

---

### **Passo 5: Criar Banco de Dados D1 (Produção)**

1. No dashboard Cloudflare, vá para **"Workers & Pages"** (menu lateral)
2. Clique na aba **"D1 SQL Database"**
3. Clique **"Create database"**
4. Configure:
   - **Database name**: `cantina-control-production`
5. Clique **"Create"**
6. **IMPORTANTE**: Copie o `database_id` que aparece (ex: `a1b2c3d4-1234-5678-90ab-cdef12345678`)

---

### **Passo 6: Atualizar Configuração do Banco**

Você precisa atualizar o arquivo `wrangler.jsonc` com o ID do banco:

1. No seu repositório GitHub, abra o arquivo `wrangler.jsonc`
2. Clique no ícone de lápis para editar
3. Encontre a seção `d1_databases`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "cantina-control-production",
    "database_id": "COLE-SEU-DATABASE-ID-AQUI"  // ← COLE O ID DO PASSO 5
  }
]
```

4. Substitua `"local-db-for-development"` pelo ID copiado
5. Commit: `Update database ID for production`

---

### **Passo 7: Aplicar Migrations no Banco D1**

Você precisa criar as tabelas no banco de produção. Faça isso via **Wrangler CLI**:

#### Instalar Wrangler (uma vez só):

```bash
npm install -g wrangler
```

#### Fazer login no Cloudflare:

```bash
wrangler login
```
(Abrirá navegador para autenticação)

#### Aplicar migrations:

```bash
# Navegue até a pasta do projeto
cd /caminho/para/webapp

# Aplique as migrations
wrangler d1 migrations apply cantina-control-production

# Popule com dados iniciais
wrangler d1 execute cantina-control-production --file=./seed.sql
```

---

### **Passo 8: Criar Projeto Cloudflare Pages**

1. No dashboard Cloudflare, vá para **"Workers & Pages"**
2. Clique **"Create application"**
3. Selecione aba **"Pages"**
4. Clique **"Connect to Git"**
5. Autorize acesso ao GitHub quando solicitado
6. Selecione seu repositório **`cantina-control`**
7. Configure o build:

```
Project name: cantina-control
Production branch: main
Build command: npm run build
Build output directory: dist
```

8. **ANTES DE CLICAR "Save and Deploy"**, clique em **"Environment variables (advanced)"**

---

### **Passo 9: Configurar Variáveis de Ambiente**

Na seção de Environment Variables:

1. Clique **"Add variable"**
2. Configure:
   - **Variable name**: `JWT_SECRET`
   - **Value**: `cantina-control-secret-key-production-2024-ALTERE-ISSO`
   - **Environment**: Production
3. Clique **"Add variable"** novamente

**IMPORTANTE**: Na próxima etapa, vamos adicionar o binding do D1.

---

### **Passo 10: Configurar D1 Binding**

1. Ainda na configuração do projeto, role até **"D1 database bindings"**
2. Clique **"Add binding"**
3. Configure:
   - **Variable name**: `DB`
   - **D1 database**: Selecione `cantina-control-production`
4. Clique **"Save"**

---

### **Passo 11: Fazer Deploy!**

1. Agora clique **"Save and Deploy"**
2. Aguarde o build (2-3 minutos)
3. ✅ Quando terminar, você verá a URL do seu site!

**URL será algo como**: `https://cantina-control.pages.dev`

---

### **Passo 12: Testar o Deploy**

1. Acesse a URL gerada
2. Faça login com:
   - Email: `admin@cantina.com`
   - Senha: `admin123`
3. ✅ Se funcionar, está tudo pronto!

---

## 📦 OPÇÃO 2: Deploy Via Wrangler CLI (Avançado)

Se preferir fazer tudo via linha de comando:

```bash
# 1. Instalar Wrangler
npm install -g wrangler

# 2. Login no Cloudflare
wrangler login

# 3. Criar D1 database
wrangler d1 create cantina-control-production
# Copie o database_id retornado

# 4. Atualizar wrangler.jsonc com o database_id

# 5. Aplicar migrations
wrangler d1 migrations apply cantina-control-production
wrangler d1 execute cantina-control-production --file=./seed.sql

# 6. Criar projeto Pages
wrangler pages project create cantina-control --production-branch main

# 7. Build local
npm run build

# 8. Deploy
wrangler pages deploy dist --project-name cantina-control

# 9. Configurar JWT_SECRET
wrangler pages secret put JWT_SECRET --project-name cantina-control
# Digite: cantina-control-secret-key-production-2024-ALTERE-ISSO
```

---

## 🔧 **Configuração Final no Wrangler.jsonc**

Seu arquivo `wrangler.jsonc` deve estar assim:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "cantina-control",
  "compatibility_date": "2026-02-03",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cantina-control-production",
      "database_id": "SEU-DATABASE-ID-AQUI"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "cantina-control-uploads"
    }
  ]
}
```

---

## 🌐 **Domínio Customizado (Opcional)**

### Adicionar seu próprio domínio:

1. No projeto Pages, vá para **"Custom domains"**
2. Clique **"Set up a custom domain"**
3. Digite seu domínio (ex: `meucantina.com.br`)
4. Siga as instruções para configurar DNS
5. Aguarde propagação (até 24h)

---

## 🔄 **Deploys Automáticos**

Configurando via GitHub, **cada push na branch `main` faz deploy automático**!

```bash
# Faça alterações no código
git add .
git commit -m "Nova funcionalidade"
git push origin main

# Cloudflare detecta e faz deploy automaticamente
```

---

## 🐛 **Troubleshooting (Problemas Comuns)**

### ❌ Erro: "Database not found"
**Solução**: Verifique se o `database_id` no `wrangler.jsonc` está correto.

### ❌ Erro: "JWT_SECRET is not defined"
**Solução**: Configure a variável de ambiente no Cloudflare:
```bash
wrangler pages secret put JWT_SECRET --project-name cantina-control
```

### ❌ Erro: "Table users does not exist"
**Solução**: Aplique as migrations:
```bash
wrangler d1 migrations apply cantina-control-production
```

### ❌ Página em branco
**Solução**: Verifique os logs do Cloudflare:
1. Vá para o projeto Pages
2. Clique em **"View details"** do último deploy
3. Veja os logs de build e runtime

---

## 📊 **Verificar Status do Deploy**

### Via Dashboard:
1. Cloudflare Dashboard → Workers & Pages
2. Selecione `cantina-control`
3. Veja deployments, logs e analytics

### Via CLI:
```bash
# Ver deploys
wrangler pages deployment list --project-name cantina-control

# Ver logs
wrangler pages deployment tail --project-name cantina-control
```

---

## 🎯 **Checklist Final**

Antes de considerar pronto, verifique:

- [ ] ✅ Código no GitHub
- [ ] ✅ D1 Database criado
- [ ] ✅ `database_id` configurado no wrangler.jsonc
- [ ] ✅ Migrations aplicadas
- [ ] ✅ Dados seed carregados
- [ ] ✅ Projeto Pages criado
- [ ] ✅ GitHub conectado
- [ ] ✅ `JWT_SECRET` configurado
- [ ] ✅ D1 binding configurado
- [ ] ✅ Deploy concluído com sucesso
- [ ] ✅ Login funcionando
- [ ] ✅ Dashboard carregando setores
- [ ] ✅ Checklist funcionando
- [ ] ✅ Painel admin acessível

---

## 📞 **Recursos de Ajuda**

- **Documentação Cloudflare Pages**: https://developers.cloudflare.com/pages/
- **Documentação D1**: https://developers.cloudflare.com/d1/
- **Documentação Wrangler**: https://developers.cloudflare.com/workers/wrangler/
- **Comunidade Cloudflare**: https://community.cloudflare.com/

---

## 🎉 **Parabéns!**

Se tudo funcionou, seu **Cantina Control** está rodando na edge da Cloudflare, acessível globalmente com latência ultra-baixa!

**URL de Produção**: https://cantina-control.pages.dev (ou seu domínio customizado)

**Credenciais Admin**:
- Email: `admin@cantina.com`
- Senha: `admin123`

---

## 📝 **Próximos Passos**

Após o deploy:

1. **Altere a senha do admin** na primeira vez
2. **Configure domínio customizado** se tiver
3. **Convide usuários** para testar
4. **Monitore analytics** no dashboard Cloudflare
5. **Configure alertas** se necessário

---

**Boa sorte com o deploy! 🚀**

Se encontrar algum problema, consulte a seção de Troubleshooting ou me avise!
