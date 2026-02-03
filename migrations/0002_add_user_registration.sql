-- Add status column to users table for approval workflow
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'; -- 'pending', 'active', 'rejected'

-- Create user registration requests table
CREATE TABLE IF NOT EXISTS registration_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_role TEXT NOT NULL DEFAULT 'employee', -- Role requested by user
  approved_role TEXT, -- Role approved by admin (can be different)
  reviewed_by INTEGER, -- Admin who reviewed
  reviewed_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Update users table to support 'manager' role
-- Note: SQLite doesn't support ALTER COLUMN, so we'll handle this in application logic
-- Valid roles will be: 'admin', 'manager', 'employee'

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registration_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_email ON registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
