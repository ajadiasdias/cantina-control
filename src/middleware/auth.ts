import { Context, Next } from 'hono';
import { Bindings, Variables } from '../types';
import { verifyToken } from '../utils/auth';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const secret = c.env.JWT_SECRET || 'default-secret-change-in-production';
  
  const decoded = verifyToken(token, secret);
  
  if (!decoded) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Fetch user from database
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?'
  ).bind(decoded.userId).first();

  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  c.set('user', user as any);
  await next();
}

export async function adminMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
}
