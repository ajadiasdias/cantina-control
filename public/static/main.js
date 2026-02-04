// ============================================
// CANTINA CONTROL - FRONTEND PRINCIPAL
// Versão Limpa e Funcional
// ============================================

const API_BASE = '/api';

// ============================================
// ESTADO GLOBAL
// ============================================
const state = {
  token: localStorage.getItem('token'),
  user: null,
  currentView: 'dashboard',
  currentSector: null,
  currentTaskType: 'opening',
  sectors: [],
  tasks: []
};

// ============================================
// UTILIDADES
// ============================================
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.remove('hidden');
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
}

function showView(viewName) {
  console.log('[showView] Mostrando view:', viewName);
  state.currentView = viewName;
  const views = ['dashboard-view', 'admin-view', 'checklist-view', 'admin-registrations-view'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) {
      if (v === `${viewName}-view`) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

async function apiCall(endpoint, options = {}) {
  console.log('[apiCall] Chamando:', endpoint, options);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  console.log('[apiCall] Resposta:', response.status);

  if (!response.ok) {
    if (response.status === 401) {
      console.log('[apiCall] Token inválido, fazendo logout');
      logout();
    }
    const errorText = await response.text();
    throw new Error(errorText || `Erro ${response.status}`);
  }

  return response.json();
}

// ============================================
// AUTENTICAÇÃO
// ============================================
async function login(email, password) {
  console.log('[login] Tentando login com:', email);
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    console.log('[login] Login bem-sucedido:', data);
    
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    
    return data;
  } catch (error) {
    console.error('[login] Erro:', error);
    throw error;
  }
}

function logout() {
  console.log('[logout] Fazendo logout');
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  
  // Mostrar tela de login
  const loginScreen = document.getElementById('login-screen');
  const navbar = document.getElementById('navbar');
  const app = document.getElementById('app');
  
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (navbar) navbar.classList.add('hidden');
  if (app) app.classList.add('hidden');
}

async function getCurrentUser() {
  console.log('[getCurrentUser] Buscando usuário atual');
  return await apiCall('/users/me');
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
  console.log('[loadDashboard] Carregando dashboard');
  try {
    showLoading();
    
    const [stats, sectors] = await Promise.all([
      apiCall('/dashboard/stats'),
      apiCall('/dashboard/sectors')
    ]);
    
    console.log('[loadDashboard] Stats:', stats);
    console.log('[loadDashboard] Sectors:', sectors);
    
    state.sectors = sectors;
    
    // Atualizar estatísticas
    const statTotal = document.getElementById('stat-total');
    const statCompleted = document.getElementById('stat-completed');
    const statRate = document.getElementById('stat-rate');
    const statSectors = document.getElementById('stat-sectors');
    
    if (statTotal) statTotal.textContent = stats.total_tasks || 0;
    if (statCompleted) statCompleted.textContent = stats.completed_tasks || 0;
    if (statRate) statRate.textContent = `${stats.completion_rate || 0}%`;
    if (statSectors) statSectors.textContent = stats.active_sectors || 0;
    
    // Renderizar setores
    renderSectors(sectors);
    
  } catch (error) {
    console.error('[loadDashboard] Erro:', error);
    alert('Erro ao carregar dashboard: ' + error.message);
  } finally {
    hideLoading();
  }
}

function renderSectors(sectors) {
  console.log('[renderSectors] Renderizando setores:', sectors.length);
  const container = document.getElementById('sectors-container');
  if (!container) return;
  
  if (sectors.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center col-span-full">Nenhum setor cadastrado</p>';
    return;
  }
  
  container.innerHTML = sectors.map(sector => `
    <div class="card bg-white p-6 rounded-xl shadow-md cursor-pointer" onclick="openChecklist(${sector.id})">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <span class="text-3xl">${sector.icon}</span>
          <h3 class="text-lg font-bold text-gray-800">${sector.name}</h3>
        </div>
      </div>
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Total de Tarefas</span>
          <span class="font-semibold">${sector.total_tasks || 0}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Concluídas</span>
          <span class="font-semibold text-green-600">${sector.completed_tasks || 0}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300" 
               style="width: ${sector.completion_rate || 0}%"></div>
        </div>
        <p class="text-xs text-gray-500 text-center">${sector.completion_rate || 0}% Completo</p>
      </div>
    </div>
  `).join('');
}

// ============================================
// CHECKLIST
// ============================================
function openChecklist(sectorId) {
  console.log('[openChecklist] Abrindo checklist do setor:', sectorId);
  state.currentSector = sectorId;
  showView('checklist');
  loadChecklist();
}

async function loadChecklist() {
  console.log('[loadChecklist] Carregando checklist');
  if (!state.currentSector) return;
  
  try {
    showLoading();
    
    const sector = state.sectors.find(s => s.id === state.currentSector);
    if (sector) {
      const sectorName = document.getElementById('checklist-sector-name');
      const sectorIcon = document.getElementById('checklist-sector-icon');
      if (sectorName) sectorName.textContent = sector.name;
      if (sectorIcon) sectorIcon.textContent = sector.icon;
    }
    
    const tasks = await apiCall(`/tasks?sector_id=${state.currentSector}&type=${state.currentTaskType}`);
    console.log('[loadChecklist] Tarefas carregadas:', tasks.length);
    
    state.tasks = tasks;
    renderChecklist(tasks);
    
  } catch (error) {
    console.error('[loadChecklist] Erro:', error);
    alert('Erro ao carregar checklist: ' + error.message);
  } finally {
    hideLoading();
  }
}

function renderChecklist(tasks) {
  console.log('[renderChecklist] Renderizando checklist:', tasks.length);
  const container = document.getElementById('checklist-tasks');
  if (!container) return;
  
  if (tasks.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">Nenhuma tarefa para este tipo</p>';
    return;
  }
  
  container.innerHTML = tasks.map(task => `
    <div class="bg-white p-4 rounded-lg shadow-sm border ${task.completed ? 'border-green-300 bg-green-50' : 'border-gray-200'}">
      <div class="flex items-start space-x-3">
        <input type="checkbox" 
               ${task.completed ? 'checked' : ''} 
               onchange="toggleTask(${task.id}, this.checked)"
               class="mt-1 h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500">
        <div class="flex-1">
          <h4 class="font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}">
            ${task.title}
            ${task.is_required ? '<span class="text-red-500 ml-1">*</span>' : ''}
          </h4>
          ${task.description ? `<p class="text-sm text-gray-600 mt-1">${task.description}</p>` : ''}
          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            ${task.estimated_time ? `<span><i class="far fa-clock mr-1"></i>${task.estimated_time} min</span>` : ''}
            ${task.requires_photo ? '<span><i class="fas fa-camera mr-1"></i>Foto obrigatória</span>' : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function toggleTask(taskId, completed) {
  console.log('[toggleTask] Alterando tarefa:', taskId, completed);
  try {
    if (completed) {
      await apiCall('/tasks/complete', {
        method: 'POST',
        body: JSON.stringify({ task_id: taskId })
      });
    } else {
      // TODO: Implementar uncomplete
      alert('Função de desmarcar ainda não implementada');
    }
    loadChecklist();
  } catch (error) {
    console.error('[toggleTask] Erro:', error);
    alert('Erro ao atualizar tarefa: ' + error.message);
  }
}

// ============================================
// NAVEGAÇÃO
// ============================================
function backToDashboard() {
  console.log('[backToDashboard] Voltando ao dashboard');
  showView('dashboard');
  loadDashboard();
}

function showAdminPanel() {
  console.log('[showAdminPanel] Mostrando painel admin');
  showView('admin');
  loadAdminSectors();
}

// ============================================
// ADMIN - Placeholder functions
// ============================================
function loadAdminSectors() {
  console.log('[loadAdminSectors] TODO: Carregar setores admin');
}

// ============================================
// REGISTRO
// ============================================
function showRegisterScreen() {
  console.log('[showRegisterScreen] Mostrando tela de registro');
  const loginScreen = document.getElementById('login-screen');
  const registerScreen = document.getElementById('register-screen');
  if (loginScreen) loginScreen.classList.add('hidden');
  if (registerScreen) registerScreen.classList.remove('hidden');
}

function showLoginScreen() {
  console.log('[showLoginScreen] Mostrando tela de login');
  const loginScreen = document.getElementById('login-screen');
  const registerScreen = document.getElementById('register-screen');
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (registerScreen) registerScreen.classList.add('hidden');
}

async function handleRegister(event) {
  event.preventDefault();
  console.log('[handleRegister] Processando registro');
  
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  if (data.password !== data.confirmPassword) {
    alert('As senhas não coincidem!');
    return;
  }
  
  try {
    showLoading();
    
    await apiCall('/auth/request-access', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name,
        requestedRole: data.requestedRole
      })
    });
    
    alert('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
    showLoginScreen();
    form.reset();
    
  } catch (error) {
    console.error('[handleRegister] Erro:', error);
    alert('Erro ao enviar solicitação: ' + error.message);
  } finally {
    hideLoading();
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('='.repeat(50));
  console.log('[MAIN.JS] Sistema iniciando...');
  console.log('='.repeat(50));
  
  // Setup do formulário de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    console.log('[MAIN.JS] Formulário de login encontrado');
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[MAIN.JS] Login form submitted');
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');
      
      console.log('[MAIN.JS] Email:', email);
      
      try {
        showLoading();
        
        const data = await login(email, password);
        console.log('[MAIN.JS] Login bem-sucedido!', data);
        
        // Esconder tela de login
        const loginScreen = document.getElementById('login-screen');
        const navbar = document.getElementById('navbar');
        const app = document.getElementById('app');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (navbar) navbar.classList.remove('hidden');
        if (app) app.classList.remove('hidden');
        
        // Atualizar interface
        const userName = document.getElementById('user-name');
        const adminBtn = document.getElementById('admin-btn');
        
        if (userName) userName.textContent = state.user.name;
        if (adminBtn && state.user.role === 'admin') {
          adminBtn.classList.remove('hidden');
        }
        
        // Carregar dashboard
        showView('dashboard');
        await loadDashboard();
        
      } catch (error) {
        console.error('[MAIN.JS] Erro no login:', error);
        if (errorDiv) {
          errorDiv.textContent = 'Email ou senha incorretos';
          errorDiv.classList.remove('hidden');
        }
      } finally {
        hideLoading();
      }
    });
  } else {
    console.error('[MAIN.JS] Formulário de login NÃO encontrado!');
  }
  
  // Setup do botão de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    console.log('[MAIN.JS] Botão de logout encontrado');
    logoutBtn.addEventListener('click', logout);
  }
  
  // Setup do botão admin
  const adminBtn = document.getElementById('admin-btn');
  if (adminBtn) {
    console.log('[MAIN.JS] Botão admin encontrado');
    adminBtn.addEventListener('click', showAdminPanel);
  }
  
  // Setup dos botões de tipo de tarefa
  ['opening', 'general', 'closing'].forEach(type => {
    const btn = document.getElementById(`task-type-${type}`);
    if (btn) {
      btn.addEventListener('click', () => {
        state.currentTaskType = type;
        document.querySelectorAll('[id^="task-type-"]').forEach(b => {
          b.classList.remove('bg-purple-600', 'text-white');
          b.classList.add('bg-gray-200', 'text-gray-700');
        });
        btn.classList.remove('bg-gray-200', 'text-gray-700');
        btn.classList.add('bg-purple-600', 'text-white');
        loadChecklist();
      });
    }
  });
  
  // Setup do botão voltar do checklist
  const backBtn = document.getElementById('back-to-dashboard-btn');
  if (backBtn) {
    backBtn.addEventListener('click', backToDashboard);
  }
  
  console.log('[MAIN.JS] Inicialização concluída');
  console.log('='.repeat(50));
});
