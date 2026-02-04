// ============================================
// CANTINA CONTROL - PAINEL ADMINISTRATIVO
// Funções complementares para admin
// ============================================

// ============================================
// ADMIN - SETORES
// ============================================
async function loadAdminSectors() {
  console.log('[loadAdminSectors] Carregando setores');
  try {
    showLoading();
    const sectors = await apiCall('/sectors');
    console.log('[loadAdminSectors] Setores carregados:', sectors.length);
    renderAdminSectors(sectors);
  } catch (error) {
    console.error('[loadAdminSectors] Erro:', error);
    alert('Erro ao carregar setores: ' + error.message);
  } finally {
    hideLoading();
  }
}

function renderAdminSectors(sectors) {
  console.log('[renderAdminSectors] Renderizando setores:', sectors.length);
  const container = document.getElementById('admin-sectors-list');
  if (!container) {
    console.error('[renderAdminSectors] Container não encontrado!');
    return;
  }
  
  if (sectors.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">Nenhum setor cadastrado</p>';
    return;
  }
  
  container.innerHTML = sectors.map(sector => `
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-3xl">${sector.icon}</span>
        <div>
          <h4 class="font-semibold text-gray-800">${sector.name}</h4>
          ${sector.description ? `<p class="text-sm text-gray-600">${sector.description}</p>` : ''}
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="editSector(${sector.id})" class="text-blue-600 hover:text-blue-700 px-3 py-1 rounded">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button onclick="deleteSector(${sector.id})" class="text-red-600 hover:text-red-700 px-3 py-1 rounded">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </div>
    </div>
  `).join('');
}

function showCreateSectorModal() {
  console.log('[showCreateSectorModal] Mostrando modal de criar setor');
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="sector-modal">
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-plus-circle mr-2"></i>Novo Setor
        </h3>
        <form id="create-sector-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input type="text" name="name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" placeholder="Ex: Cozinha">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea name="description" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" rows="2" placeholder="Descrição do setor"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Emoji</label>
            <input type="text" name="icon" required maxlength="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" placeholder="🍳">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Cor (hex)</label>
            <input type="text" name="color" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" placeholder="#4F46E5">
          </div>
          <div class="flex space-x-3 pt-4">
            <button type="button" onclick="closeModal('sector-modal')" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:opacity-90">
              Criar Setor
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
  
  document.getElementById('create-sector-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      showLoading();
      await apiCall('/sectors', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal('sector-modal');
      loadAdminSectors();
      alert('Setor criado com sucesso!');
    } catch (error) {
      console.error('[createSector] Erro:', error);
      alert('Erro ao criar setor: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}

async function deleteSector(sectorId) {
  if (!confirm('Tem certeza que deseja excluir este setor?')) return;
  
  try {
    showLoading();
    await apiCall(`/sectors/${sectorId}`, {
      method: 'DELETE'
    });
    loadAdminSectors();
    alert('Setor excluído com sucesso!');
  } catch (error) {
    console.error('[deleteSector] Erro:', error);
    alert('Erro ao excluir setor: ' + error.message);
  } finally {
    hideLoading();
  }
}

// ============================================
// ADMIN - TAREFAS
// ============================================
async function loadAdminTasks() {
  console.log('[loadAdminTasks] Carregando tarefas');
  try {
    showLoading();
    const tasks = await apiCall('/tasks');
    console.log('[loadAdminTasks] Tarefas carregadas:', tasks.length);
    renderAdminTasks(tasks);
  } catch (error) {
    console.error('[loadAdminTasks] Erro:', error);
    alert('Erro ao carregar tarefas: ' + error.message);
  } finally {
    hideLoading();
  }
}

function renderAdminTasks(tasks) {
  console.log('[renderAdminTasks] Renderizando tarefas:', tasks.length);
  const container = document.getElementById('admin-tasks-list');
  if (!container) {
    console.error('[renderAdminTasks] Container não encontrado!');
    return;
  }
  
  if (tasks.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">Nenhuma tarefa cadastrada</p>';
    return;
  }
  
  container.innerHTML = tasks.map(task => `
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800">
            ${task.title}
            ${task.is_required ? '<span class="text-red-500 ml-1">*</span>' : ''}
          </h4>
          ${task.description ? `<p class="text-sm text-gray-600 mt-1">${task.description}</p>` : ''}
          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span><i class="fas fa-layer-group mr-1"></i>${task.sector_name || 'N/A'}</span>
            <span><i class="fas fa-tag mr-1"></i>${task.type}</span>
            ${task.estimated_time ? `<span><i class="far fa-clock mr-1"></i>${task.estimated_time} min</span>` : ''}
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="editTask(${task.id})" class="text-blue-600 hover:text-blue-700 px-3 py-1 rounded">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteTask(${task.id})" class="text-red-600 hover:text-red-700 px-3 py-1 rounded">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function showCreateTaskModal() {
  console.log('[showCreateTaskModal] Mostrando modal de criar tarefa');
  
  // Carregar setores primeiro
  const sectors = await apiCall('/sectors');
  
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" id="task-modal">
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 my-8">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-plus-circle mr-2"></i>Nova Tarefa
        </h3>
        <form id="create-task-form" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Setor *</label>
              <select name="sector_id" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                <option value="">Selecione...</option>
                ${sectors.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select name="type" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
                <option value="opening">Abertura</option>
                <option value="general">Geral</option>
                <option value="closing">Fechamento</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Título *</label>
            <input type="text" name="title" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" placeholder="Ex: Limpar bancada">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea name="description" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" rows="2" placeholder="Descrição detalhada da tarefa"></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tempo estimado (min)</label>
              <input type="number" name="estimated_time" min="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600" placeholder="15">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ordem</label>
              <input type="number" name="order_number" min="0" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600">
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input type="checkbox" name="is_required" value="1" class="mr-2">
              <span class="text-sm text-gray-700">Tarefa obrigatória</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" name="requires_photo" value="1" class="mr-2">
              <span class="text-sm text-gray-700">Requer foto</span>
            </label>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button type="button" onclick="closeModal('task-modal')" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:opacity-90">
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
  
  document.getElementById('create-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Converter checkboxes
    data.is_required = data.is_required === '1';
    data.requires_photo = data.requires_photo === '1';
    
    try {
      showLoading();
      await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal('task-modal');
      loadAdminTasks();
      alert('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('[createTask] Erro:', error);
      alert('Erro ao criar tarefa: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}

async function deleteTask(taskId) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
  
  try {
    showLoading();
    await apiCall(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
    loadAdminTasks();
    alert('Tarefa excluída com sucesso!');
  } catch (error) {
    console.error('[deleteTask] Erro:', error);
    alert('Erro ao excluir tarefa: ' + error.message);
  } finally {
    hideLoading();
  }
}

// ============================================
// ADMIN - USUÁRIOS
// ============================================
async function loadAdminUsers() {
  console.log('[loadAdminUsers] Carregando usuários');
  try {
    showLoading();
    const users = await apiCall('/users');
    console.log('[loadAdminUsers] Usuários carregados:', users.length);
    renderAdminUsers(users);
  } catch (error) {
    console.error('[loadAdminUsers] Erro:', error);
    alert('Erro ao carregar usuários: ' + error.message);
  } finally {
    hideLoading();
  }
}

function renderAdminUsers(users) {
  console.log('[renderAdminUsers] Renderizando usuários:', users.length);
  const container = document.getElementById('admin-users-list');
  if (!container) {
    console.error('[renderAdminUsers] Container não encontrado!');
    return;
  }
  
  if (users.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">Nenhum usuário cadastrado</p>';
    return;
  }
  
  container.innerHTML = users.map(user => `
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 class="font-semibold text-gray-800">${user.name}</h4>
          <p class="text-sm text-gray-600">${user.email}</p>
          <span class="text-xs px-2 py-1 rounded ${
            user.role === 'admin' ? 'bg-red-100 text-red-700' : 
            user.role === 'manager' ? 'bg-blue-100 text-blue-700' : 
            'bg-gray-100 text-gray-700'
          }">
            ${user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Gestor' : 'Funcionário'}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// ADMIN - NAVEGAÇÃO DE ABAS
// ============================================
function showAdminTab(tabName) {
  console.log('[showAdminTab] Mostrando aba:', tabName);
  
  // Ocultar todos os painéis
  ['admin-sectors-panel', 'admin-tasks-panel', 'admin-users-panel', 'admin-reports-panel'].forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('hidden');
  });
  
  // Mostrar painel selecionado
  const selectedPanel = document.getElementById(`admin-${tabName}-panel`);
  if (selectedPanel) selectedPanel.classList.remove('hidden');
  
  // Atualizar tabs ativos
  document.querySelectorAll('.admin-tab-btn').forEach(tab => {
    tab.classList.remove('tab-active', 'border-purple-600', 'text-purple-600');
    tab.classList.add('border-transparent', 'text-gray-600');
  });
  
  const selectedTab = document.querySelector(`.admin-tab-btn[data-tab="${tabName}"]`);
  if (selectedTab) {
    selectedTab.classList.remove('border-transparent', 'text-gray-600');
    selectedTab.classList.add('tab-active', 'border-purple-600', 'text-purple-600');
  }
  
  // Carregar dados da aba
  switch(tabName) {
    case 'sectors':
      loadAdminSectors();
      break;
    case 'tasks':
      loadAdminTasks();
      break;
    case 'users':
      loadAdminUsers();
      break;
    case 'reports':
      // TODO: Carregar relatórios
      break;
  }
}

// ============================================
// INICIALIZAÇÃO DOS EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('[ADMIN.JS] Inicializando event listeners admin...');
  
  // Tabs do admin
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) showAdminTab(tab);
    });
  });
  
  // Botão adicionar setor
  const addSectorBtn = document.getElementById('add-sector-btn');
  if (addSectorBtn) {
    addSectorBtn.addEventListener('click', showCreateSectorModal);
  }
  
  // Botão adicionar tarefa
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', showCreateTaskModal);
  }
  
  console.log('[ADMIN.JS] Event listeners configurados');
});

// ============================================
// UTILIDADES
// ============================================
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

// Tornar funções globais
window.loadAdminSectors = loadAdminSectors;
window.showCreateSectorModal = showCreateSectorModal;
window.deleteSector = deleteSector;
window.loadAdminTasks = loadAdminTasks;
window.showCreateTaskModal = showCreateTaskModal;
window.deleteTask = deleteTask;
window.loadAdminUsers = loadAdminUsers;
window.showAdminTab = showAdminTab;
window.closeModal = closeModal;
