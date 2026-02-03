-- Seed initial admin user
-- Password: admin123 (hashed with bcrypt)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES 
  (1, 'admin@cantina.com', '$2a$10$nbD1j0wYAM33/GxX1smC7.b9.McLMgBZ6Ybt6iA.1EayuaH3gwQZ.', 'Administrador', 'admin');

-- Seed sample sectors
INSERT OR IGNORE INTO sectors (name, description, icon, color, order_number) VALUES 
  ('Cozinha', 'Preparo de alimentos e limpeza da cozinha', '🍳', '#ef4444', 1),
  ('Pizzaria', 'Preparo de pizzas e massas', '🍕', '#f97316', 2),
  ('Salão', 'Atendimento ao cliente e organização do salão', '🪑', '#3b82f6', 3),
  ('Caixa', 'Atendimento no caixa e controle financeiro', '💰', '#10b981', 4),
  ('Bar', 'Preparo de bebidas e drinks', '🍹', '#8b5cf6', 5);

-- Seed sample tasks for Cozinha
INSERT OR IGNORE INTO tasks (sector_id, type, title, description, is_required, requires_photo, estimated_time, order_number, days_of_week) VALUES
  (1, 'opening', 'Verificar estoque de ingredientes', 'Conferir disponibilidade de ingredientes principais', 1, 0, 10, 1, '[0,1,2,3,4,5,6]'),
  (1, 'opening', 'Limpar e organizar bancadas', 'Higienizar todas as superfícies de trabalho', 1, 1, 15, 2, '[0,1,2,3,4,5,6]'),
  (1, 'opening', 'Verificar equipamentos', 'Ligar e testar fogões, fornos e geladeiras', 1, 0, 5, 3, '[0,1,2,3,4,5,6]'),
  (1, 'general', 'Preparar molhos do dia', 'Preparar molhos básicos para o serviço', 0, 0, 30, 1, '[0,1,2,3,4,5,6]'),
  (1, 'general', 'Organizar mise en place', 'Preparar ingredientes pré-processados', 1, 0, 20, 2, '[0,1,2,3,4,5,6]'),
  (1, 'closing', 'Limpar equipamentos', 'Limpar fogões, fornos e chapas', 1, 1, 20, 1, '[0,1,2,3,4,5,6]'),
  (1, 'closing', 'Descartar lixo', 'Retirar todo o lixo e limpar lixeiras', 1, 0, 10, 2, '[0,1,2,3,4,5,6]'),
  (1, 'closing', 'Verificar validade dos alimentos', 'Conferir datas de validade e armazenamento', 1, 0, 15, 3, '[0,1,2,3,4,5,6]');

-- Seed sample tasks for Pizzaria
INSERT OR IGNORE INTO tasks (sector_id, type, title, description, is_required, requires_photo, estimated_time, order_number, days_of_week) VALUES
  (2, 'opening', 'Preparar massas', 'Preparar massa de pizza fresca', 1, 0, 45, 1, '[0,1,2,3,4,5,6]'),
  (2, 'opening', 'Organizar ingredientes', 'Separar e organizar coberturas', 1, 0, 15, 2, '[0,1,2,3,4,5,6]'),
  (2, 'opening', 'Ligar forno a lenha', 'Acender e aquecer o forno', 1, 0, 20, 3, '[0,1,2,3,4,5,6]'),
  (2, 'general', 'Reabastecer ingredientes', 'Repor ingredientes durante o serviço', 0, 0, 10, 1, '[0,1,2,3,4,5,6]'),
  (2, 'closing', 'Limpar forno', 'Limpar e esfriar o forno', 1, 1, 25, 1, '[0,1,2,3,4,5,6]'),
  (2, 'closing', 'Embalar massas restantes', 'Armazenar massas não utilizadas', 1, 0, 10, 2, '[0,1,2,3,4,5,6]');

-- Seed sample tasks for Salão
INSERT OR IGNORE INTO tasks (sector_id, type, title, description, is_required, requires_photo, estimated_time, order_number, days_of_week) VALUES
  (3, 'opening', 'Montar mesas', 'Organizar mesas com talheres e guardanapos', 1, 1, 20, 1, '[0,1,2,3,4,5,6]'),
  (3, 'opening', 'Limpar cadeiras e mesas', 'Higienizar mobiliário do salão', 1, 0, 15, 2, '[0,1,2,3,4,5,6]'),
  (3, 'opening', 'Verificar cardápios', 'Conferir disponibilidade e limpeza dos cardápios', 1, 0, 5, 3, '[0,1,2,3,4,5,6]'),
  (3, 'general', 'Repor guardanapos e talheres', 'Manter estoque nas mesas', 0, 0, 10, 1, '[0,1,2,3,4,5,6]'),
  (3, 'closing', 'Limpar todas as mesas', 'Higienizar e organizar mesas', 1, 0, 20, 1, '[0,1,2,3,4,5,6]'),
  (3, 'closing', 'Varrer e passar pano', 'Limpar piso do salão', 1, 1, 25, 2, '[0,1,2,3,4,5,6]'),
  (3, 'closing', 'Organizar cadeiras', 'Posicionar cadeiras para limpeza', 1, 0, 10, 3, '[0,1,2,3,4,5,6]');

-- Seed sample tasks for Caixa
INSERT OR IGNORE INTO tasks (sector_id, type, title, description, is_required, requires_photo, estimated_time, order_number, days_of_week) VALUES
  (4, 'opening', 'Contar troco inicial', 'Conferir e organizar troco do dia', 1, 0, 10, 1, '[0,1,2,3,4,5,6]'),
  (4, 'opening', 'Ligar sistema', 'Inicializar sistema de vendas', 1, 0, 5, 2, '[0,1,2,3,4,5,6]'),
  (4, 'opening', 'Verificar impressora', 'Testar impressora fiscal e papel', 1, 0, 5, 3, '[0,1,2,3,4,5,6]'),
  (4, 'closing', 'Fechar caixa', 'Conferir valores do dia', 1, 1, 20, 1, '[0,1,2,3,4,5,6]'),
  (4, 'closing', 'Emitir relatório', 'Gerar relatório de vendas', 1, 0, 10, 2, '[0,1,2,3,4,5,6]'),
  (4, 'closing', 'Depositar valores', 'Preparar valores para depósito', 1, 1, 15, 3, '[0,1,2,3,4,5,6]');

-- Seed sample tasks for Bar
INSERT OR IGNORE INTO tasks (sector_id, type, title, description, is_required, requires_photo, estimated_time, order_number, days_of_week) VALUES
  (5, 'opening', 'Reabastecer bebidas', 'Repor estoque de bebidas no bar', 1, 0, 15, 1, '[0,1,2,3,4,5,6]'),
  (5, 'opening', 'Preparar garnishes', 'Cortar frutas e preparar decorações', 1, 0, 20, 2, '[0,1,2,3,4,5,6]'),
  (5, 'opening', 'Limpar balcão', 'Higienizar área do bar', 1, 0, 10, 3, '[0,1,2,3,4,5,6]'),
  (5, 'general', 'Repor gelo', 'Manter estoque de gelo adequado', 0, 0, 5, 1, '[0,1,2,3,4,5,6]'),
  (5, 'closing', 'Limpar equipamentos', 'Limpar máquinas e utensílios', 1, 1, 20, 1, '[0,1,2,3,4,5,6]'),
  (5, 'closing', 'Conferir estoque', 'Verificar níveis de bebidas', 1, 0, 15, 2, '[0,1,2,3,4,5,6]');
