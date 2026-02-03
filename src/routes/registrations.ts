import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const registrations = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Require admin for all routes
registrations.use('/*', requireAuth, requireAdmin);

// List all registration requests
registrations.get('/', async (c) => {
  const status = c.req.query('status') || 'pending';

  const requests = await c.env.DB.prepare(
    'SELECT id, email, name, requested_role, status, rejection_reason, created_at, reviewed_at FROM registration_requests WHERE status = ? ORDER BY created_at DESC'
  ).bind(status).all();

  return c.json(requests.results || []);
});

// Get registration request by ID
registrations.get('/:id', async (c) => {
  const id = c.req.param('id');

  const request = await c.env.DB.prepare(
    'SELECT id, email, name, requested_role, status, rejection_reason, created_at, reviewed_at FROM registration_requests WHERE id = ?'
  ).bind(id).first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  return c.json(request);
});

const approveSchema = z.object({
  approvedRole: z.enum(['admin', 'manager', 'employee']),
});

// Approve registration request
registrations.post('/:id/approve', zValidator('json', approveSchema), async (c) => {
  const id = c.req.param('id');
  const { approvedRole } = c.req.valid('json');
  const adminId = c.get('user').userId;

  // Get registration request
  const request = await c.env.DB.prepare(
    'SELECT * FROM registration_requests WHERE id = ? AND status = "pending"'
  ).bind(id).first();

  if (!request) {
    return c.json({ error: 'Request not found or already processed' }, 404);
  }

  // Check if user already exists
  const existingUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(request.email).first();

  if (existingUser) {
    return c.json({ error: 'User already exists' }, 400);
  }

  // Create user
  await c.env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, "active")'
  ).bind(request.email, request.password_hash, request.name, approvedRole).run();

  // Update registration request
  await c.env.DB.prepare(
    'UPDATE registration_requests SET status = "approved", approved_role = ?, reviewed_by = ?, reviewed_at = datetime("now") WHERE id = ?'
  ).bind(approvedRole, adminId, id).run();

  return c.json({
    message: 'Registration request approved successfully',
    email: request.email,
    role: approvedRole,
  });
});

const rejectSchema = z.object({
  reason: z.string().min(1),
});

// Reject registration request
registrations.post('/:id/reject', zValidator('json', rejectSchema), async (c) => {
  const id = c.req.param('id');
  const { reason } = c.req.valid('json');
  const adminId = c.get('user').userId;

  // Get registration request
  const request = await c.env.DB.prepare(
    'SELECT * FROM registration_requests WHERE id = ? AND status = "pending"'
  ).bind(id).first();

  if (!request) {
    return c.json({ error: 'Request not found or already processed' }, 404);
  }

  // Update registration request
  await c.env.DB.prepare(
    'UPDATE registration_requests SET status = "rejected", rejection_reason = ?, reviewed_by = ?, reviewed_at = datetime("now") WHERE id = ?'
  ).bind(reason, adminId, id).run();

  return c.json({
    message: 'Registration request rejected',
    email: request.email,
  });
});

// Delete registration request
registrations.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const result = await c.env.DB.prepare(
    'DELETE FROM registration_requests WHERE id = ?'
  ).bind(id).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Request not found' }, 404);
  }

  return c.json({ message: 'Request deleted successfully' });
});

export default registrations;
