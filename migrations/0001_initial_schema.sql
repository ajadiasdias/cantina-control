-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee', -- 'admin' or 'employee'
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
  type TEXT NOT NULL, -- 'opening', 'general', 'closing'
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT 0,
  requires_photo BOOLEAN DEFAULT 0,
  estimated_time INTEGER, -- in minutes
  order_number INTEGER DEFAULT 0,
  days_of_week TEXT, -- JSON array: [0,1,2,3,4,5,6] for Sun-Sat
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

-- User invitations table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_sector ON tasks(sector_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_completions_user ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
