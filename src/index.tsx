import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { Bindings, Variables } from './types';

// Import routes
import auth from './routes/auth';
import sectors from './routes/sectors';
import tasks from './routes/tasks';
import dashboard from './routes/dashboard';
import reports from './routes/reports';
import users from './routes/users';
import registrations from './routes/registrations';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS
app.use('/api/*', cors());

// API routes
app.route('/api/auth', auth);
app.route('/api/sectors', sectors);
app.route('/api/tasks', tasks);
app.route('/api/dashboard', dashboard);
app.route('/api/reports', reports);
app.route('/api/users', users);
app.route('/api/registrations', registrations);

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cantina Control - Gerenciamento de Tarefas</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .card { transition: all 0.3s ease; }
            .card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
            .btn { transition: all 0.2s ease; }
            .btn:hover { transform: scale(1.05); }
            .tab-active { border-bottom: 3px solid #667eea; color: #667eea; font-weight: 600; }
            .task-card { border-left: 4px solid #e5e7eb; }
            .task-card.completed { border-left-color: #10b981; background-color: #f0fdf4; }
            .task-card.required { border-left-color: #ef4444; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Loading Spinner -->
        <div id="loading" class="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 hidden">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-5xl text-purple-600 mb-4"></i>
                <p class="text-gray-600">Carregando...</p>
            </div>
        </div>

        <!-- Navbar -->
        <nav id="navbar" class="gradient-bg text-white shadow-lg hidden">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-utensils text-2xl"></i>
                        <span class="text-xl font-bold">Cantina Control</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span id="user-name" class="hidden md:block"></span>
                        <button id="admin-btn" class="hidden bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition">
                            <i class="fas fa-cog mr-2"></i>Admin
                        </button>
                        <button id="logout-btn" class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition">
                            <i class="fas fa-sign-out-alt mr-2"></i>Sair
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Login Screen -->
        <div id="login-screen" class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div class="text-center">
                    <i class="fas fa-utensils text-6xl text-purple-600 mb-4"></i>
                    <h2 class="text-3xl font-bold text-gray-900">Cantina Control</h2>
                    <p class="mt-2 text-gray-600">Gerenciamento de Tarefas para Cantinas</p>
                </div>
                <div class="bg-white p-8 rounded-xl shadow-lg">
                    <form id="login-form" class="space-y-6" onsubmit="return false;">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                            <input type="email" id="login-email" name="email" required autocomplete="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="seu@email.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                            <input type="password" id="login-password" name="password" required autocomplete="current-password" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="••••••••">
                        </div>
                        <button type="submit" id="login-submit-btn" class="w-full gradient-bg text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
                            <i class="fas fa-sign-in-alt mr-2"></i>Entrar
                        </button>
                        <div id="login-error" class="hidden text-red-600 text-sm text-center"></div>
                    </form>
                    <div class="mt-6 text-center">
                        <p class="text-gray-600">Não tem uma conta?</p>
                        <button onclick="showRegisterScreen()" class="text-purple-600 hover:text-purple-700 font-semibold mt-2">
                            Solicitar Acesso
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Register Screen -->
        <div id="register-screen" class="hidden min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div class="text-center">
                    <i class="fas fa-user-plus text-6xl text-purple-600 mb-4"></i>
                    <h2 class="text-3xl font-bold text-gray-900">Solicitar Acesso</h2>
                    <p class="mt-2 text-gray-600">Preencha o formulário abaixo</p>
                </div>
                <div class="bg-white p-8 rounded-xl shadow-lg">
                    <form id="register-form" onsubmit="handleRegister(event)" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                            <input type="text" name="name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="Seu nome">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                            <input type="email" name="email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="seu@email.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                            <input type="password" name="password" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="••••••••">
                            <p class="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                            <input type="password" name="confirmPassword" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="••••••••">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nível de Acesso Solicitado</label>
                            <select name="requestedRole" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                                <option value="employee">Funcionário</option>
                                <option value="manager">Gestor</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">O administrador irá revisar sua solicitação</p>
                        </div>
                        <button type="submit" class="w-full gradient-bg text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
                            <i class="fas fa-paper-plane mr-2"></i>Enviar Solicitação
                        </button>
                        <div id="register-error" class="hidden text-red-600 text-sm text-center"></div>
                        <div id="register-success" class="hidden text-green-600 text-sm text-center"></div>
                    </form>
                    <div class="mt-6 text-center">
                        <button onclick="showLoginScreen()" class="text-purple-600 hover:text-purple-700 font-semibold">
                            <i class="fas fa-arrow-left mr-1"></i>Voltar ao Login
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main App -->
        <div id="app" class="hidden">
            <!-- Dashboard View -->
            <div id="dashboard-view" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-xl shadow-md p-6 card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">Tarefas Hoje</p>
                                <p id="stat-total" class="text-3xl font-bold text-gray-900">0</p>
                            </div>
                            <i class="fas fa-tasks text-4xl text-blue-500"></i>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-md p-6 card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">Concluídas</p>
                                <p id="stat-completed" class="text-3xl font-bold text-green-600">0</p>
                            </div>
                            <i class="fas fa-check-circle text-4xl text-green-500"></i>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-md p-6 card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">Taxa de Conclusão</p>
                                <p id="stat-rate" class="text-3xl font-bold text-purple-600">0%</p>
                            </div>
                            <i class="fas fa-chart-line text-4xl text-purple-500"></i>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl shadow-md p-6 card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-500 text-sm">Setores Ativos</p>
                                <p id="stat-sectors" class="text-3xl font-bold text-orange-600">0</p>
                            </div>
                            <i class="fas fa-layer-group text-4xl text-orange-500"></i>
                        </div>
                    </div>
                </div>

                <!-- Sectors Grid -->
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Setores</h2>
                    <div id="sectors-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Sectors will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Checklist View -->
            <div id="checklist-view" class="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="mb-6">
                    <button id="back-btn" class="text-purple-600 hover:text-purple-700 font-semibold">
                        <i class="fas fa-arrow-left mr-2"></i>Voltar ao Dashboard
                    </button>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <span id="sector-icon" class="text-4xl"></span>
                            <div>
                                <h2 id="sector-name" class="text-2xl font-bold text-gray-900"></h2>
                                <p id="sector-description" class="text-gray-600"></p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Progresso</p>
                            <p id="sector-progress" class="text-2xl font-bold text-purple-600">0/0</p>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div class="border-b border-gray-200 mb-6">
                        <div class="flex space-x-8">
                            <button class="tab-btn py-3 px-1 tab-active" data-type="opening">
                                <i class="fas fa-sun mr-2"></i>Abertura
                            </button>
                            <button class="tab-btn py-3 px-1" data-type="general">
                                <i class="fas fa-clipboard-list mr-2"></i>Geral
                            </button>
                            <button class="tab-btn py-3 px-1" data-type="closing">
                                <i class="fas fa-moon mr-2"></i>Fechamento
                            </button>
                        </div>
                    </div>

                    <!-- Tasks List -->
                    <div id="tasks-container" class="space-y-4">
                        <!-- Tasks will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Admin View -->
            <div id="admin-view" class="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="mb-6">
                    <button id="admin-back-btn" class="text-purple-600 hover:text-purple-700 font-semibold">
                        <i class="fas fa-arrow-left mr-2"></i>Voltar ao Dashboard
                    </button>
                </div>

                <!-- Admin Tabs -->
                <div class="bg-white rounded-xl shadow-lg mb-6">
                    <div class="border-b border-gray-200 px-6">
                        <div class="flex space-x-8">
                            <button class="admin-tab-btn py-4 px-1 tab-active" data-tab="sectors">
                                <i class="fas fa-layer-group mr-2"></i>Setores
                            </button>
                            <button class="admin-tab-btn py-4 px-1" data-tab="tasks">
                                <i class="fas fa-tasks mr-2"></i>Tarefas
                            </button>
                            <button class="admin-tab-btn py-4 px-1" data-tab="users">
                                <i class="fas fa-users mr-2"></i>Usuários
                            </button>
                            <button onclick="openRegistrationRequests()" class="py-4 px-1 text-gray-700 hover:text-purple-600 transition">
                                <i class="fas fa-user-clock mr-2"></i>Solicitações
                            </button>
                            <button class="admin-tab-btn py-4 px-1" data-tab="reports">
                                <i class="fas fa-chart-bar mr-2"></i>Relatórios
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Admin Panels -->
                <div id="admin-sectors-panel" class="admin-panel">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold">Gerenciar Setores</h3>
                            <button id="add-sector-btn" class="gradient-bg text-white px-4 py-2 rounded-lg btn">
                                <i class="fas fa-plus mr-2"></i>Novo Setor
                            </button>
                        </div>
                        <div id="admin-sectors-list" class="space-y-4">
                            <!-- Sectors list will be loaded here -->
                        </div>
                    </div>
                </div>

                <div id="admin-tasks-panel" class="admin-panel hidden">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold">Gerenciar Tarefas</h3>
                            <button id="add-task-btn" class="gradient-bg text-white px-4 py-2 rounded-lg btn">
                                <i class="fas fa-plus mr-2"></i>Nova Tarefa
                            </button>
                        </div>
                        <div class="mb-4 flex space-x-4">
                            <select id="filter-sector" class="px-4 py-2 border rounded-lg">
                                <option value="">Todos os Setores</option>
                            </select>
                            <select id="filter-type" class="px-4 py-2 border rounded-lg">
                                <option value="">Todos os Tipos</option>
                                <option value="opening">Abertura</option>
                                <option value="general">Geral</option>
                                <option value="closing">Fechamento</option>
                            </select>
                        </div>
                        <div id="admin-tasks-list" class="space-y-4">
                            <!-- Tasks list will be loaded here -->
                        </div>
                    </div>
                </div>

                <div id="admin-users-panel" class="admin-panel hidden">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold">Gerenciar Usuários</h3>
                            <button id="invite-user-btn" class="gradient-bg text-white px-4 py-2 rounded-lg btn">
                                <i class="fas fa-user-plus mr-2"></i>Convidar Usuário
                            </button>
                        </div>
                        <div id="admin-users-list" class="space-y-4">
                            <!-- Users list will be loaded here -->
                        </div>
                    </div>
                </div>

                <div id="admin-reports-panel" class="admin-panel hidden">
                    <div class="space-y-6">
                        <div class="bg-white rounded-xl shadow-lg p-6">
                            <h3 class="text-xl font-bold mb-4">Filtros</h3>
                            <div class="flex space-x-4">
                                <select id="report-period" class="px-4 py-2 border rounded-lg">
                                    <option value="7">Últimos 7 dias</option>
                                    <option value="30">Últimos 30 dias</option>
                                    <option value="90">Últimos 90 dias</option>
                                </select>
                                <select id="report-sector" class="px-4 py-2 border rounded-lg">
                                    <option value="">Todos os Setores</option>
                                </select>
                                <button id="generate-report-btn" class="gradient-bg text-white px-6 py-2 rounded-lg btn">
                                    <i class="fas fa-sync mr-2"></i>Atualizar
                                </button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div class="bg-white rounded-xl shadow-md p-6">
                                <p class="text-gray-500 text-sm">Total de Tarefas</p>
                                <p id="report-total" class="text-3xl font-bold text-gray-900">0</p>
                            </div>
                            <div class="bg-white rounded-xl shadow-md p-6">
                                <p class="text-gray-500 text-sm">Tarefas Concluídas</p>
                                <p id="report-completed" class="text-3xl font-bold text-green-600">0</p>
                            </div>
                            <div class="bg-white rounded-xl shadow-md p-6">
                                <p class="text-gray-500 text-sm">Tarefas Pendentes</p>
                                <p id="report-pending" class="text-3xl font-bold text-orange-600">0</p>
                            </div>
                            <div class="bg-white rounded-xl shadow-md p-6">
                                <p class="text-gray-500 text-sm">Taxa de Conclusão</p>
                                <p id="report-rate" class="text-3xl font-bold text-purple-600">0%</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="bg-white rounded-xl shadow-lg p-6">
                                <h3 class="text-xl font-bold mb-4">Conclusões ao Longo do Tempo</h3>
                                <canvas id="chart-timeline"></canvas>
                            </div>
                            <div class="bg-white rounded-xl shadow-lg p-6">
                                <h3 class="text-xl font-bold mb-4">Desempenho por Setor</h3>
                                <canvas id="chart-sectors"></canvas>
                            </div>
                        </div>

                        <div class="bg-white rounded-xl shadow-lg p-6">
                            <h3 class="text-xl font-bold mb-4">Tarefas por Tipo</h3>
                            <div class="max-w-md mx-auto">
                                <canvas id="chart-types"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Admin Registration Requests View -->
        <div id="admin-registrations-view" class="hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="mb-6">
                <button id="admin-registrations-back-btn" class="text-purple-600 hover:text-purple-700 font-semibold">
                    <i class="fas fa-arrow-left mr-2"></i>Voltar ao Painel Admin
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-user-clock mr-2"></i>Solicitações de Acesso
                    </h2>
                </div>

                <!-- Tabs -->
                <div class="border-b border-gray-200 mb-6">
                    <nav class="flex space-x-8">
                        <button onclick="loadRegistrationRequests('pending')" class="registration-tab-btn tab-active py-4 px-1 border-b-2 font-medium text-sm" data-status="pending">
                            Pendentes
                        </button>
                        <button onclick="loadRegistrationRequests('approved')" class="registration-tab-btn py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300" data-status="approved">
                            Aprovadas
                        </button>
                        <button onclick="loadRegistrationRequests('rejected')" class="registration-tab-btn py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300" data-status="rejected">
                            Rejeitadas
                        </button>
                    </nav>
                </div>

                <!-- Registration Requests List -->
                <div id="registration-requests-list" class="space-y-4">
                    <!-- Requests will be loaded here -->
                </div>
            </div>
        </div>

        <!-- SCRIPTS PRINCIPAIS -->
        <script src="/static/main.js"></script>
        <script src="/static/admin.js"></script>
    </body>
    </html>
  `);
});

export default app;
