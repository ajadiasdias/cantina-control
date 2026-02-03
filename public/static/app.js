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

// Placeholder functions for admin actions
function editSector(id) {
  alert('Editar setor ' + id + ' - Funcionalidade a ser implementada');
}

function deleteSector(id) {
  if (confirm('Tem certeza que deseja excluir este setor?')) {
    apiCall(`/sectors/${id}`, { method: 'DELETE' })
      .then(() => loadAdminSectors())
      .catch(err => alert('Erro ao excluir: ' + err.message));
  }
}

function editTask(id) {
  alert('Editar tarefa ' + id + ' - Funcionalidade a ser implementada');
}

function deleteTask(id) {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    apiCall(`/tasks/${id}`, { method: 'DELETE' })
      .then(() => loadAdminTasks())
      .catch(err => alert('Erro ao excluir: ' + err.message));
  }
}
