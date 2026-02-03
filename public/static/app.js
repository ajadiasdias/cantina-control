// API Configuration
const API_BASE = '/api';

// State Management
const state = {
  token: localStorage.getItem('token'),
  user: null,
  currentView: 'dashboard',
  currentSector: null,
  currentTaskType: 'opening',
  sectors: [],
  tasks: [],
};

// Utility Functions
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

function showView(viewId) {
  document.querySelectorAll('#app > div').forEach(div => div.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
  state.currentView = viewId;
}

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token && { 'Authorization': `Bearer ${state.token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Authentication
async function login(email, password) {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('token', data.token);
  
  return data;
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('navbar').classList.add('hidden');
  document.getElementById('app').classList.add('hidden');
}

async function getCurrentUser() {
  const user = await apiCall('/users/me');
  state.user = user;
  return user;
}

// Dashboard Functions
async function loadDashboard() {
  showLoading();
  
  try {
    const [stats, sectors] = await Promise.all([
      apiCall('/dashboard/stats'),
      apiCall('/dashboard/sectors'),
    ]);

    state.sectors = sectors;

    // Update stats
    document.getElementById('stat-total').textContent = stats.total_tasks;
    document.getElementById('stat-completed').textContent = stats.completed_tasks;
    document.getElementById('stat-rate').textContent = `${stats.completion_rate}%`;
    document.getElementById('stat-sectors').textContent = stats.active_sectors;

    // Render sectors
    renderSectors(sectors);

    showView('dashboard-view');
  } finally {
    hideLoading();
  }
}

function renderSectors(sectors) {
  const container = document.getElementById('sectors-grid');
  
  container.innerHTML = sectors.map(sector => `
    <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer card sector-card" 
         data-sector-id="${sector.id}"
         style="border-left: 4px solid ${sector.color || '#667eea'}">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">${sector.icon || '📋'}</span>
            <div>
              <h3 class="text-xl font-bold text-gray-900">${sector.name}</h3>
              <p class="text-sm text-gray-600">${sector.description || ''}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">
            <i class="fas fa-tasks mr-1"></i>
            ${sector.total_tasks} tarefas
          </span>
          <span class="text-orange-600 font-semibold">
            <i class="fas fa-clock mr-1"></i>
            ${sector.pending_tasks} pendentes
          </span>
        </div>
        ${sector.total_tasks > 0 ? `
          <div class="mt-4 bg-gray-200 rounded-full h-2">
            <div class="bg-green-500 h-2 rounded-full" style="width: ${(sector.completed_tasks / sector.total_tasks) * 100}%"></div>
          </div>
          <p class="text-xs text-gray-500 mt-1 text-right">${Math.round((sector.completed_tasks / sector.total_tasks) * 100)}% concluído</p>
        ` : ''}
      </div>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.sector-card').forEach(card => {
    card.addEventListener('click', () => {
      const sectorId = card.dataset.sectorId;
      loadChecklist(sectorId);
    });
  });
}

// Checklist Functions
async function loadChecklist(sectorId) {
  showLoading();
  
  try {
    const sector = state.sectors.find(s => s.id == sectorId);
    state.currentSector = sector;

    const tasks = await apiCall(`/tasks/sector/${sectorId}`);
    state.tasks = tasks;

    // Update header
    document.getElementById('sector-icon').textContent = sector.icon || '📋';
    document.getElementById('sector-name').textContent = sector.name;
    document.getElementById('sector-description').textContent = sector.description || '';

    // Update progress
    const completed = tasks.filter(t => t.completed).length;
    document.getElementById('sector-progress').textContent = `${completed}/${tasks.length}`;

    // Show tasks for current type
    renderTasks(state.currentTaskType);

    showView('checklist-view');
  } finally {
    hideLoading();
  }
}

function renderTasks(type) {
  const container = document.getElementById('tasks-container');
  const tasks = state.tasks.filter(t => t.type === type);

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-clipboard-check text-5xl mb-4"></i>
        <p>Nenhuma tarefa para esta categoria</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-card bg-white rounded-lg shadow-md p-4 ${task.completed ? 'completed' : ''} ${task.is_required ? 'required' : ''}" 
         data-task-id="${task.id}">
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3 flex-1">
          <input type="checkbox" 
                 class="task-checkbox mt-1 h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500" 
                 ${task.completed ? 'checked' : ''}
                 data-task-id="${task.id}">
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900 ${task.completed ? 'line-through' : ''}">${task.title}</h4>
            ${task.description ? `<p class="text-sm text-gray-600 mt-1">${task.description}</p>` : ''}
            <div class="flex flex-wrap gap-2 mt-2">
              ${task.is_required ? '<span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"><i class="fas fa-exclamation-circle mr-1"></i>Obrigatória</span>' : ''}
              ${task.requires_photo ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"><i class="fas fa-camera mr-1"></i>Requer Foto</span>' : ''}
              ${task.estimated_time ? `<span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded"><i class="fas fa-clock mr-1"></i>${task.estimated_time} min</span>` : ''}
            </div>
            ${task.completed && task.completion ? `
              <div class="mt-2 text-xs text-gray-500">
                <i class="fas fa-check-circle text-green-600 mr-1"></i>
                Concluída em ${new Date(task.completion.completed_at).toLocaleString('pt-BR')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Add checkbox handlers
  document.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const taskId = e.target.dataset.taskId;
      const isChecked = e.target.checked;

      try {
        if (isChecked) {
          await apiCall(`/tasks/${taskId}/complete`, {
            method: 'POST',
            body: JSON.stringify({}),
          });
        } else {
          await apiCall(`/tasks/${taskId}/complete`, {
            method: 'DELETE',
          });
        }
        
        // Reload checklist
        await loadChecklist(state.currentSector.id);
      } catch (error) {
        console.error('Error toggling task:', error);
        e.target.checked = !isChecked;
        alert('Erro ao atualizar tarefa: ' + error.message);
      }
    });
  });
}

// Admin Functions
async function loadAdminSectors() {
  showLoading();
  
  try {
    const sectors = await apiCall('/sectors');
    
    const container = document.getElementById('admin-sectors-list');
    container.innerHTML = sectors.map(sector => `
      <div class="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
        <div class="flex items-center space-x-4">
          <span class="text-2xl">${sector.icon || '📋'}</span>
          <div>
            <h4 class="font-semibold">${sector.name}</h4>
            <p class="text-sm text-gray-600">${sector.description || ''}</p>
            <p class="text-xs text-gray-500">Ordem: ${sector.order_number}</p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button class="text-blue-600 hover:text-blue-700" onclick="editSector(${sector.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-red-600 hover:text-red-700" onclick="deleteSector(${sector.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  } finally {
    hideLoading();
  }
}

async function loadAdminTasks() {
  showLoading();
  
  try {
    const [tasks, sectors] = await Promise.all([
      apiCall('/tasks'),
      apiCall('/sectors'),
    ]);

    // Populate sector filter
    const filterSelect = document.getElementById('filter-sector');
    filterSelect.innerHTML = '<option value="">Todos os Setores</option>' + 
      sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    const container = document.getElementById('admin-tasks-list');
    container.innerHTML = tasks.map(task => {
      const sector = sectors.find(s => s.id === task.sector_id);
      return `
        <div class="border rounded-lg p-4 hover:bg-gray-50">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-xs bg-gray-200 px-2 py-1 rounded">${sector?.name || 'N/A'}</span>
                <span class="text-xs bg-purple-200 px-2 py-1 rounded">${task.type === 'opening' ? 'Abertura' : task.type === 'closing' ? 'Fechamento' : 'Geral'}</span>
                ${task.is_required ? '<span class="text-xs bg-red-200 px-2 py-1 rounded">Obrigatória</span>' : ''}
              </div>
              <h4 class="font-semibold">${task.title}</h4>
              ${task.description ? `<p class="text-sm text-gray-600 mt-1">${task.description}</p>` : ''}
              <div class="flex space-x-4 mt-2 text-xs text-gray-500">
                ${task.estimated_time ? `<span><i class="fas fa-clock mr-1"></i>${task.estimated_time} min</span>` : ''}
                ${task.requires_photo ? '<span><i class="fas fa-camera mr-1"></i>Requer foto</span>' : ''}
                <span>Ordem: ${task.order_number}</span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button class="text-blue-600 hover:text-blue-700" onclick="editTask(${task.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="text-red-600 hover:text-red-700" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } finally {
    hideLoading();
  }
}

async function loadAdminUsers() {
  showLoading();
  
  try {
    const users = await apiCall('/users');
    
    const container = document.getElementById('admin-users-list');
    container.innerHTML = users.map(user => `
      <div class="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
        <div>
          <h4 class="font-semibold">${user.name}</h4>
          <p class="text-sm text-gray-600">${user.email}</p>
          <span class="text-xs ${user.role === 'admin' ? 'bg-purple-200' : 'bg-gray-200'} px-2 py-1 rounded mt-1 inline-block">
            ${user.role === 'admin' ? 'Administrador' : 'Funcionário'}
          </span>
        </div>
        <div class="text-sm text-gray-500">
          Desde ${new Date(user.created_at).toLocaleDateString('pt-BR')}
        </div>
      </div>
    `).join('');
  } finally {
    hideLoading();
  }
}

let timelineChart, sectorsChart, typesChart;

async function loadAdminReports() {
  showLoading();
  
  try {
    const period = document.getElementById('report-period').value;
    const sectorId = document.getElementById('report-sector').value;
    
    const params = new URLSearchParams({ period });
    if (sectorId) params.append('sector_id', sectorId);
    
    const report = await apiCall(`/reports?${params}`);

    // Update stats
    document.getElementById('report-total').textContent = report.summary.total_tasks;
    document.getElementById('report-completed').textContent = report.summary.completed_tasks;
    document.getElementById('report-pending').textContent = report.summary.pending_tasks;
    document.getElementById('report-rate').textContent = `${report.summary.completion_rate}%`;

    // Timeline Chart
    if (timelineChart) timelineChart.destroy();
    const ctxTimeline = document.getElementById('chart-timeline').getContext('2d');
    timelineChart = new Chart(ctxTimeline, {
      type: 'line',
      data: {
        labels: report.completions_over_time.map(d => new Date(d.date).toLocaleDateString('pt-BR')),
        datasets: [{
          label: 'Tarefas Concluídas',
          data: report.completions_over_time.map(d => d.count),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // Sectors Chart
    if (sectorsChart) sectorsChart.destroy();
    const ctxSectors = document.getElementById('chart-sectors').getContext('2d');
    sectorsChart = new Chart(ctxSectors, {
      type: 'bar',
      data: {
        labels: report.completions_by_sector.map(s => s.name),
        datasets: [{
          label: 'Tarefas Concluídas',
          data: report.completions_by_sector.map(s => s.count),
          backgroundColor: report.completions_by_sector.map(s => s.color || '#667eea'),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // Types Chart
    if (typesChart) typesChart.destroy();
    const ctxTypes = document.getElementById('chart-types').getContext('2d');
    const typeLabels = {
      opening: 'Abertura',
      general: 'Geral',
      closing: 'Fechamento'
    };
    typesChart = new Chart(ctxTypes, {
      type: 'doughnut',
      data: {
        labels: report.completions_by_type.map(t => typeLabels[t.type] || t.type),
        datasets: [{
          data: report.completions_by_type.map(t => t.count),
          backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6'],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // Populate sector filter
    if (document.getElementById('report-sector').options.length === 1) {
      const sectors = await apiCall('/sectors');
      const select = document.getElementById('report-sector');
      select.innerHTML = '<option value="">Todos os Setores</option>' + 
        sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
  } finally {
    hideLoading();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      showLoading();
      await login(email, password);
      
      // Show app
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('navbar').classList.remove('hidden');
      document.getElementById('app').classList.remove('hidden');
      
      // Update navbar
      document.getElementById('user-name').textContent = state.user.name;
      if (state.user.role === 'admin') {
        document.getElementById('admin-btn').classList.remove('hidden');
      }

      // Load dashboard
      await loadDashboard();
    } catch (error) {
      document.getElementById('login-error').textContent = error.message;
      document.getElementById('login-error').classList.remove('hidden');
    } finally {
      hideLoading();
    }
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Back buttons
  document.getElementById('back-btn').addEventListener('click', () => {
    loadDashboard();
  });

  document.getElementById('admin-back-btn').addEventListener('click', () => {
    loadDashboard();
  });

  // Admin button
  document.getElementById('admin-btn').addEventListener('click', async () => {
    showView('admin-view');
    await loadAdminSectors();
  });

  // Tab buttons in checklist
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      state.currentTaskType = btn.dataset.type;
      renderTasks(state.currentTaskType);
    });
  });

  // Admin tabs
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('tab-active'));
      btn.classList.add('tab-active');
      
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
      const panel = document.getElementById(`admin-${btn.dataset.tab}-panel`);
      panel.classList.remove('hidden');

      switch (btn.dataset.tab) {
        case 'sectors': await loadAdminSectors(); break;
        case 'tasks': await loadAdminTasks(); break;
        case 'users': await loadAdminUsers(); break;
        case 'reports': await loadAdminReports(); break;
      }
    });
  });

  // Generate report button
  document.getElementById('generate-report-btn').addEventListener('click', loadAdminReports);

  // Add buttons for admin panel
  document.getElementById('add-sector-btn').addEventListener('click', addSector);
  document.getElementById('add-task-btn').addEventListener('click', addTask);
  document.getElementById('invite-user-btn').addEventListener('click', inviteUser);

  // Check if already logged in
  if (state.token) {
    try {
      showLoading();
      await getCurrentUser();
      
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('navbar').classList.remove('hidden');
      document.getElementById('app').classList.remove('hidden');
      
      document.getElementById('user-name').textContent = state.user.name;
      if (state.user.role === 'admin') {
        document.getElementById('admin-btn').classList.remove('hidden');
      }

      await loadDashboard();
    } catch (error) {
      logout();
    } finally {
      hideLoading();
    }
  }
});

// Modal functions
function createModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="gradient-bg text-white p-6 rounded-t-xl flex justify-between items-center">
        <h3 class="text-xl font-bold">${title}</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-gray-200">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      <div class="p-6">
        ${content}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

// Sector CRUD functions
function addSector() {
  const content = `
    <form id="sector-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Nome *</label>
        <input type="text" name="name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Descrição</label>
        <textarea name="description" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" rows="3"></textarea>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Ícone (emoji)</label>
        <input type="text" name="icon" placeholder="🍳" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Cor (hex)</label>
        <input type="color" name="color" value="#667eea" class="w-full h-10 border rounded-lg">
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Ordem</label>
        <input type="number" name="order_number" value="0" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
      </div>
      <div class="flex space-x-3">
        <button type="submit" class="flex-1 gradient-bg text-white py-2 rounded-lg font-semibold hover:opacity-90">
          <i class="fas fa-save mr-2"></i>Salvar
        </button>
        <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400">
          Cancelar
        </button>
      </div>
    </form>
  `;
  
  const modal = createModal('Novo Setor', content);
  
  document.getElementById('sector-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      color: formData.get('color'),
      order_number: parseInt(formData.get('order_number'))
    };
    
    try {
      showLoading();
      await apiCall('/sectors', { method: 'POST', body: JSON.stringify(data) });
      modal.remove();
      await loadAdminSectors();
      alert('Setor criado com sucesso!');
    } catch (error) {
      alert('Erro ao criar setor: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}

async function editSector(id) {
  try {
    showLoading();
    const sector = await apiCall(`/sectors/${id}`);
    hideLoading();
    
    const content = `
      <form id="sector-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Nome *</label>
          <input type="text" name="name" value="${sector.name}" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Descrição</label>
          <textarea name="description" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" rows="3">${sector.description || ''}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Ícone (emoji)</label>
          <input type="text" name="icon" value="${sector.icon || ''}" placeholder="🍳" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Cor (hex)</label>
          <input type="color" name="color" value="${sector.color || '#667eea'}" class="w-full h-10 border rounded-lg">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Ordem</label>
          <input type="number" name="order_number" value="${sector.order_number}" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div class="flex space-x-3">
          <button type="submit" class="flex-1 gradient-bg text-white py-2 rounded-lg font-semibold hover:opacity-90">
            <i class="fas fa-save mr-2"></i>Salvar
          </button>
          <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400">
            Cancelar
          </button>
        </div>
      </form>
    `;
    
    const modal = createModal('Editar Setor', content);
    
    document.getElementById('sector-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        icon: formData.get('icon'),
        color: formData.get('color'),
        order_number: parseInt(formData.get('order_number'))
      };
      
      try {
        showLoading();
        await apiCall(`/sectors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        modal.remove();
        await loadAdminSectors();
        alert('Setor atualizado com sucesso!');
      } catch (error) {
        alert('Erro ao atualizar setor: ' + error.message);
      } finally {
        hideLoading();
      }
    });
  } catch (error) {
    hideLoading();
    alert('Erro ao carregar setor: ' + error.message);
  }
}

function deleteSector(id) {
  if (confirm('Tem certeza que deseja excluir este setor? Todas as tarefas associadas serão excluídas.')) {
    apiCall(`/sectors/${id}`, { method: 'DELETE' })
      .then(() => {
        loadAdminSectors();
        alert('Setor excluído com sucesso!');
      })
      .catch(err => alert('Erro ao excluir: ' + err.message));
  }
}

// Task CRUD functions
async function addTask() {
  try {
    showLoading();
    const sectors = await apiCall('/sectors');
    hideLoading();
    
    const content = `
      <form id="task-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Setor *</label>
          <select name="sector_id" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
            <option value="">Selecione um setor</option>
            ${sectors.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Tipo *</label>
          <select name="type" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
            <option value="opening">Abertura</option>
            <option value="general">Geral</option>
            <option value="closing">Fechamento</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Título *</label>
          <input type="text" name="title" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Descrição</label>
          <textarea name="description" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" rows="3"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="flex items-center space-x-2">
              <input type="checkbox" name="is_required" class="h-4 w-4 text-purple-600 rounded">
              <span class="text-sm font-medium">Tarefa Obrigatória</span>
            </label>
          </div>
          <div>
            <label class="flex items-center space-x-2">
              <input type="checkbox" name="requires_photo" class="h-4 w-4 text-purple-600 rounded">
              <span class="text-sm font-medium">Requer Foto</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Tempo Estimado (minutos)</label>
          <input type="number" name="estimated_time" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Ordem</label>
          <input type="number" name="order_number" value="0" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Dias da Semana</label>
          <div class="grid grid-cols-4 gap-2">
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="0" checked class="rounded">
              <span class="text-sm">Dom</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="1" checked class="rounded">
              <span class="text-sm">Seg</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="2" checked class="rounded">
              <span class="text-sm">Ter</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="3" checked class="rounded">
              <span class="text-sm">Qua</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="4" checked class="rounded">
              <span class="text-sm">Qui</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="5" checked class="rounded">
              <span class="text-sm">Sex</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="6" checked class="rounded">
              <span class="text-sm">Sáb</span>
            </label>
          </div>
        </div>
        <div class="flex space-x-3">
          <button type="submit" class="flex-1 gradient-bg text-white py-2 rounded-lg font-semibold hover:opacity-90">
            <i class="fas fa-save mr-2"></i>Salvar
          </button>
          <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400">
            Cancelar
          </button>
        </div>
      </form>
    `;
    
    const modal = createModal('Nova Tarefa', content);
    
    document.getElementById('task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const days = Array.from(formData.getAll('days')).map(d => parseInt(d));
      
      const data = {
        sector_id: parseInt(formData.get('sector_id')),
        type: formData.get('type'),
        title: formData.get('title'),
        description: formData.get('description'),
        is_required: formData.get('is_required') === 'on',
        requires_photo: formData.get('requires_photo') === 'on',
        estimated_time: formData.get('estimated_time') ? parseInt(formData.get('estimated_time')) : null,
        order_number: parseInt(formData.get('order_number')),
        days_of_week: JSON.stringify(days)
      };
      
      try {
        showLoading();
        await apiCall('/tasks', { method: 'POST', body: JSON.stringify(data) });
        modal.remove();
        await loadAdminTasks();
        alert('Tarefa criada com sucesso!');
      } catch (error) {
        alert('Erro ao criar tarefa: ' + error.message);
      } finally {
        hideLoading();
      }
    });
  } catch (error) {
    hideLoading();
    alert('Erro ao carregar setores: ' + error.message);
  }
}

async function editTask(id) {
  try {
    showLoading();
    const [task, sectors] = await Promise.all([
      apiCall(`/tasks/${id}`),
      apiCall('/sectors')
    ]);
    hideLoading();
    
    const days = JSON.parse(task.days_of_week || '[0,1,2,3,4,5,6]');
    
    const content = `
      <form id="task-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Setor *</label>
          <select name="sector_id" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
            ${sectors.map(s => `<option value="${s.id}" ${s.id === task.sector_id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Tipo *</label>
          <select name="type" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
            <option value="opening" ${task.type === 'opening' ? 'selected' : ''}>Abertura</option>
            <option value="general" ${task.type === 'general' ? 'selected' : ''}>Geral</option>
            <option value="closing" ${task.type === 'closing' ? 'selected' : ''}>Fechamento</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Título *</label>
          <input type="text" name="title" value="${task.title}" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Descrição</label>
          <textarea name="description" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" rows="3">${task.description || ''}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="flex items-center space-x-2">
              <input type="checkbox" name="is_required" ${task.is_required ? 'checked' : ''} class="h-4 w-4 text-purple-600 rounded">
              <span class="text-sm font-medium">Tarefa Obrigatória</span>
            </label>
          </div>
          <div>
            <label class="flex items-center space-x-2">
              <input type="checkbox" name="requires_photo" ${task.requires_photo ? 'checked' : ''} class="h-4 w-4 text-purple-600 rounded">
              <span class="text-sm font-medium">Requer Foto</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Tempo Estimado (minutos)</label>
          <input type="number" name="estimated_time" value="${task.estimated_time || ''}" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Ordem</label>
          <input type="number" name="order_number" value="${task.order_number}" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Dias da Semana</label>
          <div class="grid grid-cols-4 gap-2">
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="0" ${days.includes(0) ? 'checked' : ''} class="rounded">
              <span class="text-sm">Dom</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="1" ${days.includes(1) ? 'checked' : ''} class="rounded">
              <span class="text-sm">Seg</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="2" ${days.includes(2) ? 'checked' : ''} class="rounded">
              <span class="text-sm">Ter</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="3" ${days.includes(3) ? 'checked' : ''} class="rounded">
              <span class="text-sm">Qua</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="4" ${days.includes(4) ? 'checked' : ''} class="rounded">
              <span class="text-sm">Qui</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="5" ${days.includes(5) ? 'checked' : ''} class="rounded">
              <span class="text-sm">Sex</span>
            </label>
            <label class="flex items-center space-x-1">
              <input type="checkbox" name="days" value="6" ${days.includes(6) ? 'checked' : ''} class="rounded">
              <span class="text-sm">Sáb</span>
            </label>
          </div>
        </div>
        <div class="flex space-x-3">
          <button type="submit" class="flex-1 gradient-bg text-white py-2 rounded-lg font-semibold hover:opacity-90">
            <i class="fas fa-save mr-2"></i>Salvar
          </button>
          <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400">
            Cancelar
          </button>
        </div>
      </form>
    `;
    
    const modal = createModal('Editar Tarefa', content);
    
    document.getElementById('task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const days = Array.from(formData.getAll('days')).map(d => parseInt(d));
      
      const data = {
        sector_id: parseInt(formData.get('sector_id')),
        type: formData.get('type'),
        title: formData.get('title'),
        description: formData.get('description'),
        is_required: formData.get('is_required') === 'on',
        requires_photo: formData.get('requires_photo') === 'on',
        estimated_time: formData.get('estimated_time') ? parseInt(formData.get('estimated_time')) : null,
        order_number: parseInt(formData.get('order_number')),
        days_of_week: JSON.stringify(days)
      };
      
      try {
        showLoading();
        await apiCall(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        modal.remove();
        await loadAdminTasks();
        alert('Tarefa atualizada com sucesso!');
      } catch (error) {
        alert('Erro ao atualizar tarefa: ' + error.message);
      } finally {
        hideLoading();
      }
    });
  } catch (error) {
    hideLoading();
    alert('Erro ao carregar tarefa: ' + error.message);
  }
}

function deleteTask(id) {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    apiCall(`/tasks/${id}`, { method: 'DELETE' })
      .then(() => {
        loadAdminTasks();
        alert('Tarefa excluída com sucesso!');
      })
      .catch(err => alert('Erro ao excluir: ' + err.message));
  }
}

// User invite function
function inviteUser() {
  const content = `
    <form id="invite-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Email *</label>
        <input type="email" name="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600" placeholder="usuario@email.com">
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Função *</label>
        <select name="role" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600">
          <option value="employee">Funcionário</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          Um convite será enviado para o email informado. O link de convite expira em 7 dias.
        </p>
      </div>
      <div class="flex space-x-3">
        <button type="submit" class="flex-1 gradient-bg text-white py-2 rounded-lg font-semibold hover:opacity-90">
          <i class="fas fa-envelope mr-2"></i>Enviar Convite
        </button>
        <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400">
          Cancelar
        </button>
      </div>
    </form>
  `;
  
  const modal = createModal('Convidar Usuário', content);
  
  document.getElementById('invite-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      email: formData.get('email'),
      role: formData.get('role')
    };
    
    try {
      showLoading();
      const result = await apiCall('/users/invite', { method: 'POST', body: JSON.stringify(data) });
      modal.remove();
      
      // Show invitation link
      const linkModal = createModal('Convite Criado', `
        <div class="space-y-4">
          <p class="text-green-600 font-semibold">
            <i class="fas fa-check-circle mr-2"></i>
            Convite criado com sucesso!
          </p>
          <div class="bg-gray-100 p-4 rounded-lg">
            <p class="text-sm font-medium mb-2">Link de Convite:</p>
            <input type="text" value="${window.location.origin}${result.invitation_link}" readonly class="w-full px-3 py-2 bg-white border rounded text-sm">
          </div>
          <p class="text-sm text-gray-600">
            Compartilhe este link com o usuário. Válido por 7 dias.
          </p>
          <button onclick="this.closest('.fixed').remove()" class="w-full gradient-bg text-white py-2 rounded-lg font-semibold hover:opacity-90">
            OK
          </button>
        </div>
      `);
      
      await loadAdminUsers();
    } catch (error) {
      alert('Erro ao criar convite: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}
