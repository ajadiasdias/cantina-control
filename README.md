# Cantina Control

Sistema completo de gerenciamento de tarefas e checklists para cantinas e restaurantes, desenvolvido com Hono + Cloudflare Pages + D1 Database.

## 🎯 Visão Geral

O **Cantina Control** é uma aplicação web moderna e eficiente para gerenciar tarefas diárias em cantinas e restaurantes. O sistema organiza tarefas por setores (Cozinha, Pizzaria, Salão, Caixa, Bar) e categorias (Abertura, Geral, Fechamento), permitindo controle completo das operações diárias.

## ✨ Funcionalidades Principais

### 👤 Autenticação e Usuários
- ✅ Login seguro com JWT
- ✅ Sistema de convites para novos usuários
- ✅ Dois níveis de acesso: Admin e Funcionário
- ✅ Gerenciamento de perfil

### 📊 Dashboard
- ✅ Visão geral das tarefas do dia
- ✅ Estatísticas em tempo real (Total, Concluídas, Taxa de Conclusão)
- ✅ Cards de setores com progresso visual
- ✅ Indicadores de tarefas pendentes por setor

### ✅ Sistema de Checklist
- ✅ Tarefas organizadas por abas (Abertura, Geral, Fechamento)
- ✅ Marcação de tarefas como concluídas
- ✅ Suporte para tarefas obrigatórias
- ✅ Tarefas que requerem fotos (estrutura implementada)
- ✅ Tempo estimado para cada tarefa
- ✅ Filtro por dia da semana

### 🛠️ Painel Administrativo
- ✅ **Gerenciamento de Setores**: Criar, editar e excluir setores
- ✅ **Gerenciamento de Tarefas**: CRUD completo de tarefas
- ✅ **Gerenciamento de Usuários**: Visualizar usuários e enviar convites
- ✅ **Relatórios**: Analytics com gráficos interativos

### 📈 Relatórios
- ✅ Filtros por período (7, 30, 90 dias)
- ✅ Filtros por setor
- ✅ Gráfico de evolução temporal
- ✅ Gráfico de desempenho por setor
- ✅ Gráfico de distribuição por tipo de tarefa
- ✅ Últimas tarefas concluídas

## 🚀 Tecnologias Utilizadas

### Backend
- **Hono** - Framework web ultrarrápido para edge computing
- **Cloudflare D1** - Banco de dados SQLite distribuído globalmente
- **Cloudflare Workers** - Runtime serverless na edge
- **TypeScript** - Linguagem tipada
- **Zod** - Validação de schemas
- **bcryptjs** - Hash de senhas

### Frontend
- **TailwindCSS** - Framework CSS utility-first via CDN
- **FontAwesome** - Ícones via CDN
- **Chart.js** - Gráficos interativos
- **JavaScript Vanilla** - Sem frameworks frontend

## 📦 Estrutura do Banco de Dados

### Tabelas Principais
- **users** - Usuários do sistema (admins e funcionários)
- **sectors** - Setores da cantina (Cozinha, Pizzaria, etc)
- **tasks** - Tarefas configuradas por setor
- **task_completions** - Registro de tarefas concluídas
- **invitations** - Convites pendentes para novos usuários

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ instalado
- NPM ou outro gerenciador de pacotes

### Instalação Local

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd webapp

# 2. Instale as dependências
npm install

# 3. Configure o banco de dados local
npm run db:migrate:local
npm run db:seed

# 4. Inicie o servidor de desenvolvimento
npm run build
pm2 start ecosystem.config.cjs

# Ou para desenvolvimento direto:
npm run dev:sandbox
```

### Variáveis de Ambiente

Crie um arquivo `.dev.vars` para desenvolvimento local:

```env
JWT_SECRET=cantina-control-secret-key-change-in-production-2024
```

## 👥 Credenciais de Teste

**Usuário Admin:**
- Email: `admin@cantina.com`
- Senha: `admin123`

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro (requer convite)

### Setores
- `GET /api/sectors` - Listar setores
- `GET /api/sectors/:id` - Obter setor
- `GET /api/sectors/:id/stats` - Estatísticas do setor
- `POST /api/sectors` - Criar setor (admin)
- `PUT /api/sectors/:id` - Atualizar setor (admin)
- `DELETE /api/sectors/:id` - Deletar setor (admin)

### Tarefas
- `GET /api/tasks` - Listar tarefas (com filtros)
- `GET /api/tasks/:id` - Obter tarefa
- `GET /api/tasks/sector/:sectorId` - Tarefas por setor
- `POST /api/tasks` - Criar tarefa (admin)
- `PUT /api/tasks/:id` - Atualizar tarefa (admin)
- `DELETE /api/tasks/:id` - Deletar tarefa (admin)
- `POST /api/tasks/:id/complete` - Marcar como concluída
- `DELETE /api/tasks/:id/complete` - Desmarcar conclusão

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/sectors` - Setores com estatísticas
- `GET /api/dashboard/recent-completions` - Tarefas recentes

### Relatórios
- `GET /api/reports` - Relatórios com filtros
- `GET /api/reports/latest` - Últimas conclusões

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/me` - Usuário atual
- `PUT /api/users/me` - Atualizar perfil
- `POST /api/users/invite` - Convidar usuário (admin)
- `GET /api/users/invitations` - Listar convites (admin)

## 🌐 URLs do Projeto

### Desenvolvimento (Sandbox)
- **URL Pública**: https://3000-i1py5o1wxvlropmugexdg-2e1b9533.sandbox.novita.ai
- **Login**: Use as credenciais de teste acima

### Produção (Cloudflare Pages)
- Será gerado após deploy: `https://webapp.pages.dev`

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Vite dev server
npm run dev:sandbox         # Wrangler dev com D1 local
npm run build               # Build para produção

# Banco de Dados
npm run db:migrate:local    # Aplicar migrations (local)
npm run db:migrate:prod     # Aplicar migrations (produção)
npm run db:seed             # Popular banco com dados
npm run db:reset            # Resetar banco local

# Deploy
npm run deploy              # Deploy para Cloudflare Pages
npm run deploy:prod         # Deploy com nome do projeto

# Utilitários
npm run clean-port          # Limpar porta 3000
npm run cf-typegen          # Gerar tipos do Cloudflare
```

## 🎨 Setores e Tarefas Pré-configurados

O sistema vem com 5 setores pré-configurados:

1. **Cozinha** 🍳 - 8 tarefas (abertura, geral, fechamento)
2. **Pizzaria** 🍕 - 6 tarefas
3. **Salão** 🪑 - 7 tarefas
4. **Caixa** 💰 - 6 tarefas
5. **Bar** 🍹 - 6 tarefas

Total: **33 tarefas** distribuídas entre os setores

## 🔐 Segurança

- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Autenticação JWT com tokens de 7 dias
- ✅ Middleware de autenticação em todas as rotas protegidas
- ✅ Middleware de autorização admin
- ✅ Validação de schemas com Zod
- ✅ Proteção contra SQL injection (prepared statements)

## 📱 Responsividade

O sistema é totalmente responsivo, funcionando perfeitamente em:
- 📱 Smartphones
- 📱 Tablets
- 💻 Desktops
- 🖥️ Telas grandes

## 🚀 Deploy no Cloudflare Pages

### Configuração da Produção

1. **Criar banco D1 na produção:**
```bash
npx wrangler d1 create webapp-production
```

2. **Atualizar `wrangler.jsonc` com o database_id retornado**

3. **Aplicar migrations na produção:**
```bash
npm run db:migrate:prod
```

4. **Criar projeto Cloudflare Pages:**
```bash
npx wrangler pages project create webapp --production-branch main
```

5. **Deploy:**
```bash
npm run deploy:prod
```

6. **Configurar secret JWT_SECRET:**
```bash
npx wrangler pages secret put JWT_SECRET --project-name webapp
```

## 🎯 Próximas Funcionalidades

- [ ] Upload real de fotos para Cloudflare R2
- [ ] Sistema de notificações
- [ ] Histórico de conclusões por usuário
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] Sistema de lembretes automáticos
- [ ] App mobile PWA
- [ ] Integração com calendário
- [ ] Multi-tenancy (múltiplas cantinas)

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👨‍💻 Desenvolvido com

- ❤️ Paixão por desenvolvimento
- ☕ Muito café
- 🧠 Hono Framework
- ⚡ Cloudflare Workers Edge Computing
- 🎨 TailwindCSS

---

**Cantina Control** - Gerenciamento profissional para o seu negócio!
