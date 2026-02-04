// Registration and Access Management Functions

// Close modal helper
function closeModal() {
  const modal = document.querySelector('.fixed.inset-0');
  if (modal) {
    modal.remove();
  }
}

// Request Access (User Registration)
async function requestAccess(email, password, name, requestedRole = 'employee') {
  try {
    showLoading();
    const response = await fetch(`${API_BASE}/auth/request-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, requestedRole }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request access');
    }

    return data;
  } finally {
    hideLoading();
  }
}

// Check Registration Status
async function checkRegistrationStatus(email) {
  const response = await fetch(`${API_BASE}/auth/registration-status/${encodeURIComponent(email)}`);
  return response.json();
}

// Load Registration Requests (Admin only)
async function loadRegistrationRequests(status = 'pending') {
  const requests = await apiCall(`/registrations?status=${status}`);
  
  const container = document.getElementById('registration-requests-list');
  
  if (!requests || requests.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-inbox text-5xl mb-4"></i>
        <p>Nenhuma solicitação ${status === 'pending' ? 'pendente' : status === 'approved' ? 'aprovada' : 'rejeitada'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = requests.map(req => `
    <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">${req.name}</h3>
          <p class="text-gray-600">${req.email}</p>
          <div class="flex items-center space-x-4 mt-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <i class="fas fa-user-tag mr-1"></i>
              ${req.requested_role === 'manager' ? 'Gestor' : 'Funcionário'}
            </span>
            <span class="text-sm text-gray-500">
              <i class="fas fa-calendar mr-1"></i>
              ${new Date(req.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        ${status === 'pending' ? `
          <div class="flex space-x-2 ml-4">
            <button onclick="approveRegistration(${req.id})" 
                    class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition">
              <i class="fas fa-check mr-1"></i>Aprovar
            </button>
            <button onclick="rejectRegistration(${req.id})" 
                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition">
              <i class="fas fa-times mr-1"></i>Rejeitar
            </button>
          </div>
        ` : status === 'rejected' && req.rejection_reason ? `
          <div class="ml-4 text-sm text-red-600">
            <i class="fas fa-exclamation-circle mr-1"></i>
            ${req.rejection_reason}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Approve Registration
async function approveRegistration(requestId) {
  const modalContent = `
    <p class="text-gray-600 mb-4">Selecione o nível de acesso para este usuário:</p>
    <form id="approve-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Nível de Acesso</label>
        <select name="approvedRole" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
          <option value="employee">Funcionário</option>
          <option value="manager">Gestor</option>
          <option value="admin">Administrador</option>
        </select>
        <p class="text-sm text-gray-500 mt-2">
          <strong>Funcionário:</strong> Acesso ao checklist de tarefas<br>
          <strong>Gestor:</strong> Pode gerenciar setores e tarefas<br>
          <strong>Administrador:</strong> Acesso total ao sistema
        </p>
      </div>
      <div class="flex justify-end space-x-3">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition">
          <i class="fas fa-check mr-2"></i>Aprovar
        </button>
      </div>
    </form>
  `;
  
  const modal = createModal('Aprovar Solicitação', modalContent);

  document.getElementById('approve-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const approvedRole = e.target.approvedRole.value;

    try {
      showLoading();
      await apiCall(`/registrations/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approvedRole }),
      });
      
      closeModal();
      alert('Solicitação aprovada com sucesso!');
      loadRegistrationRequests('pending');
    } catch (error) {
      alert('Erro ao aprovar solicitação: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}

// Reject Registration
async function rejectRegistration(requestId) {
  const modalContent = `
    <p class="text-gray-600 mb-4">Por favor, informe o motivo da rejeição:</p>
    <form id="reject-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Motivo da Rejeição</label>
        <textarea name="reason" required rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="Ex: Não autorizado para esta cantina..."></textarea>
      </div>
      <div class="flex justify-end space-x-3">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition">
          <i class="fas fa-times mr-2"></i>Rejeitar
        </button>
      </div>
    </form>
  `;
  
  const modal = createModal('Rejeitar Solicitação', modalContent);

  document.getElementById('reject-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reason = e.target.reason.value;

    try {
      showLoading();
      await apiCall(`/registrations/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      
      closeModal();
      alert('Solicitação rejeitada.');
      loadRegistrationRequests('pending');
    } catch (error) {
      alert('Erro ao rejeitar solicitação: ' + error.message);
    } finally {
      hideLoading();
    }
  });
}

// Show Register Screen
function showRegisterScreen() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('register-screen').classList.remove('hidden');
}

// Show Login Screen
function showLoginScreen() {
  document.getElementById('register-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

// Handle Registration Form
async function handleRegister(e) {
  e.preventDefault();
  
  const form = e.target;
  const email = form.email.value;
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const name = form.name.value;
  const requestedRole = form.requestedRole.value;

  // Clear previous errors
  document.getElementById('register-error').classList.add('hidden');
  document.getElementById('register-success').classList.add('hidden');

  // Validate password match
  if (password !== confirmPassword) {
    document.getElementById('register-error').textContent = 'As senhas não coincidem';
    document.getElementById('register-error').classList.remove('hidden');
    return;
  }

  try {
    const result = await requestAccess(email, password, name, requestedRole);
    
    // Show success message
    document.getElementById('register-success').textContent = result.message;
    document.getElementById('register-success').classList.remove('hidden');
    
    // Clear form
    form.reset();
    
    // Show login screen after 3 seconds
    setTimeout(() => {
      showLoginScreen();
      alert('Sua solicitação foi enviada! Aguarde a aprovação do administrador.');
    }, 3000);
  } catch (error) {
    document.getElementById('register-error').textContent = error.message;
    document.getElementById('register-error').classList.remove('hidden');
  }
}

// Open Admin Registration Requests Panel
function openRegistrationRequests() {
  showView('admin-registrations-view');
  loadRegistrationRequests('pending');
}
