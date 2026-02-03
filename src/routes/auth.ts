import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  invitationToken: z.string().optional(),
});

// Login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await verifyPassword(password, user.password_hash as string);

  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const secret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const token = generateToken(user.id as number, user.email as string, user.role as string, secret);

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

// Register (requires invitation token or first user)
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name, invitationToken } = c.req.valid('json');

  // Check if user already exists
  const existingUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first();

  if (existingUser) {
    return c.json({ error: 'User already exists' }, 400);
  }

  // Check if this is the first user (becomes admin)
  const userCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM users'
  ).first();

  let role = 'employee';

  if ((userCount?.count as number) === 0) {
    // First user becomes admin
    role = 'admin';
  } else if (invitationToken) {
    // Validate invitation token
    const invitation = await c.env.DB.prepare(
      'SELECT * FROM invitations WHERE token = ? AND used = 0 AND expires_at > datetime("now")'
    ).bind(invitationToken).first();

    if (!invitation) {
      return c.json({ error: 'Invalid or expired invitation' }, 400);
    }

    role = invitation.role as string;

    // Mark invitation as used
    await c.env.DB.prepare(
      'UPDATE invitations SET used = 1 WHERE token = ?'
    ).bind(invitationToken).run();
  } else {
    return c.json({ error: 'Invitation token required' }, 400);
  }

  // Create user
  const passwordHash = await hashPassword(password);

  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).bind(email, passwordHash, name, role).run();

  const userId = result.meta.last_row_id;

  const secret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  const token = generateToken(userId as number, email, role, secret);

  return c.json({
    token,
    user: {
      id: userId,
      email,
      name,
      role,
    },
  }, 201);
});

export default auth;
