# ⚠️ PERMISSÕES DO TOKEN CLOUDFLARE

## 🔴 Problema Identificado

O token atual não tem permissões para criar bancos D1.

---

## ✅ SOLUÇÃO: Criar Novo Token com Permissões Corretas

### **Passo 1: Criar Token Personalizado**

1. Acesse: **https://dash.cloudflare.com/profile/api-tokens**
2. Clique **"Create Token"**
3. Clique **"Create Custom Token"** (no final da página)

### **Passo 2: Configurar Permissões**

Configure EXATAMENTE assim:

#### **Permissions** (Permissões):
- **Account** → **D1** → **Edit** ✅
- **Account** → **Workers Scripts** → **Edit** ✅
- **Account** → **Cloudflare Pages** → **Edit** ✅
- **Account** → **Account Settings** → **Read** ✅

#### **Account Resources** (Recursos da Conta):
- **Include** → **Adeniltondias@gmail.com's Account** ✅

#### **Client IP Address Filtering** (Opcional):
- Deixe em branco (permite todos os IPs)

#### **TTL** (Tempo de Vida):
- Escolha a duração desejada (recomendo: 1 ano)

### **Passo 3: Criar e Copiar Token**

1. Clique **"Continue to summary"**
2. Clique **"Create Token"**
3. **COPIE O TOKEN** (só aparece uma vez!)
4. Guarde em local seguro

### **Passo 4: Atualizar no Genspark**

1. Na interface do Genspark, vá em **"Deploy"** (menu lateral)
2. Cole o NOVO token no campo **"Cloudflare API Key"**
3. Clique **"Save"**

---

## 🎯 ALTERNATIVA: Usar Dashboard Cloudflare

Se você tem problemas com permissões de token, pode fazer tudo pelo dashboard:

### **1. Criar Banco D1**
1. Acesse: https://dash.cloudflare.com
2. **Workers & Pages** → **D1 SQL Database**
3. Clique **"Create database"**
4. Nome: `cantina-control-production`
5. Clique **"Create"**
6. **COPIE o database_id**

### **2. Atualizar wrangler.jsonc**
1. No seu repositório GitHub: https://github.com/ajadiasdias/cantina-control
2. Abra o arquivo `wrangler.jsonc`
3. Clique no lápis para editar
4. Encontre:
```jsonc
"database_id": "local-db-for-development"
```
5. Substitua por:
```jsonc
"database_id": "SEU-DATABASE-ID-COPIADO"
```
6. Commit changes

### **3. Aplicar Migrations (Via Dashboard)**
1. No banco D1 criado, clique **"Console"**
2. Cole e execute este SQL:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sectors table
CREATE TABLE IF NOT EXISTS sectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_number INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sector_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT 0,
  requires_photo BOOLEAN DEFAULT 0,
  estimated_time INTEGER,
  order_number INTEGER DEFAULT 0,
  days_of_week TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
);

-- Task completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  photo_url TEXT,
  notes TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  invited_by INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_sector ON tasks(sector_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_completions_user ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
```

### **4. Popular com Dados Iniciais (Via Console)**

Cole e execute no Console do D1:

```sql
-- Admin user (senha: admin123)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES 
  (1, 'admin@cantina.com', '$2a$10$nbD1j0wYAM33/GxX1smC7.b9.McLMgBZ6Ybt6iA.1EayuaH3gwQZ.', 'Administrador', 'admin');

-- Setores
INSERT OR IGNORE INTO sectors (name, description, icon, color, order_number) VALUES 
  ('Cozinha', 'Preparo de alimentos e limpeza da cozinha', '🍳', '#ef4444', 1),
  ('Pizzaria', 'Preparo de pizzas e massas', '🍕', '#f97316', 2),
  ('Salão', 'Atendimento ao cliente e organização do salão', '🪑', '#3b82f6', 3),
  ('Caixa', 'Atendimento no caixa e controle financeiro', '💰', '#10b981', 4),
  ('Bar', 'Preparo de bebidas e drinks', '🍹', '#8b5cf6', 5);
```

(Nota: Para economizar espaço, só inclui dados essenciais. O seed.sql completo tem todas as tarefas)

### **5. Criar Projeto Cloudflare Pages**
1. **Workers & Pages** → **Create application** → **Pages**
2. **Connect to Git** → Autorize GitHub
3. Selecione repositório: `cantina-control`
4. Configure:
   - Project name: `cantina-control`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Environment variables**:
   - Add variable: `JWT_SECRET` = `cantina-control-secret-production-2024`
6. **D1 database bindings**:
   - Add binding: Variable name `DB`, D1 database `cantina-control-production`
7. Clique **"Save and Deploy"**

---

## 🎉 RESULTADO

Após seguir os passos acima, seu site estará em:
**https://cantina-control.pages.dev**

**Login:**
- Email: `admin@cantina.com`
- Senha: `admin123`

---

## 📝 RESUMO DAS OPÇÕES

### **Opção A: Corrigir Token (Mais Técnico)**
- Criar novo token com permissões corretas
- Executar `./deploy-auto.sh` novamente

### **Opção B: Dashboard Manual (Mais Fácil)** ⭐
- Criar tudo pelo dashboard do Cloudflare
- Copiar SQLs e executar no console
- Não precisa de CLI/terminal

**Recomendo a Opção B se você não tem experiência com CLI!**

---

**Links Importantes:**
- Dashboard: https://dash.cloudflare.com
- API Tokens: https://dash.cloudflare.com/profile/api-tokens
- Seu GitHub: https://github.com/ajadiasdias/cantina-control
