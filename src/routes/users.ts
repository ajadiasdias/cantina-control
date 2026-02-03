import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { generateRandomToken } from '../utils/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware
users.use('*', authMiddleware);

// Get all users (admin only)
users.get('/', adminMiddleware, async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
  ).all();

  return c.json(result.results);
});

// Get current user
users.get('/me', async (c) => {
  const user = c.get('user');
  return c.json(user);
});

// Update current user
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

users.put('/me', zValidator('json', updateUserSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  if (data.email) {
    // Check if email is already taken
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ? AND id != ?'
    ).bind(data.email, user.id).first();

    if (existing) {
      return c.json({ error: 'Email already in use' }, 400);
    }
  }

  const updates: string[] = [];
  const bindings: any[] = [];

  if (data.name) {
    updates.push('name = ?');
    bindings.push(data.name);
  }

  if (data.email) {
    updates.push('email = ?');
    bindings.push(data.email);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(user.id);

    await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...bindings).run();
  }

  const updated = await c.env.DB.prepare(
    'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?'
  ).bind(user.id).first();

  return c.json(updated);
});

// Invite user (admin only)
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'employee']).optional(),
});

users.post('/invite', adminMiddleware, zValidator('json', inviteSchema), async (c) => {
  const data = c.req.valid('json');
  const user = c.get('user');

  // Check if user already exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(data.email).first();

  if (existing) {
    return c.json({ error: 'User already exists' }, 400);
  }

  // Check if there's an active invitation
  const activeInvitation = await c.env.DB.prepare(
    'SELECT id FROM invitations WHERE email = ? AND used = 0 AND expires_at > datetime("now")'
  ).bind(data.email).first();

  if (activeInvitation) {
    return c.json({ error: 'Active invitation already exists for this email' }, 400);
  }

  // Create invitation
  const token = generateRandomToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const result = await c.env.DB.prepare(
    'INSERT INTO invitations (email, token, role, invited_by, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    data.email,
    token,
    data.role || 'employee',
    user.id,
    expiresAt.toISOString()
  ).run();

  const invitation = await c.env.DB.prepare(
    'SELECT * FROM invitations WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({
    ...invitation,
    invitation_link: `/register?token=${token}`,
  }, 201);
});

// Get invitations (admin only)
users.get('/invitations', adminMiddleware, async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT 
       i.id, i.email, i.role, i.token, i.expires_at, i.used, i.created_at,
       u.name as invited_by_name
     FROM invitations i
     JOIN users u ON i.invited_by = u.id
     ORDER BY i.created_at DESC`
  ).all();

  return c.json(result.results);
});

// Delete invitation (admin only)
users.delete('/invitations/:id', adminMiddleware, async (c) => {
  const id = c.req.param('id');

  await c.env.DB.prepare(
    'DELETE FROM invitations WHERE id = ?'
  ).bind(id).run();

  return c.json({ message: 'Invitation deleted successfully' });
});

export default users;
