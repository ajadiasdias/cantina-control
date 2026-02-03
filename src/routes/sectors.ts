import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const sectors = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
sectors.use('*', authMiddleware);

const sectorSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order_number: z.number().optional(),
});

// Get all sectors
sectors.get('/', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM sectors ORDER BY order_number ASC, name ASC'
  ).all();

  return c.json(result.results);
});

// Get sector by ID
sectors.get('/:id', async (c) => {
  const id = c.req.param('id');

  const sector = await c.env.DB.prepare(
    'SELECT * FROM sectors WHERE id = ?'
  ).bind(id).first();

  if (!sector) {
    return c.json({ error: 'Sector not found' }, 404);
  }

  return c.json(sector);
});

// Get sector with tasks count
sectors.get('/:id/stats', async (c) => {
  const id = c.req.param('id');
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday

  const sector = await c.env.DB.prepare(
    'SELECT * FROM sectors WHERE id = ?'
  ).bind(id).first();

  if (!sector) {
    return c.json({ error: 'Sector not found' }, 404);
  }

  // Get tasks for today
  const tasks = await c.env.DB.prepare(
    `SELECT * FROM tasks 
     WHERE sector_id = ? 
     AND (days_of_week LIKE '%' || ? || '%' OR days_of_week = '[]')
     ORDER BY type, order_number`
  ).bind(id, today.toString()).all();

  // Get completed tasks for today
  const completions = await c.env.DB.prepare(
    `SELECT DISTINCT task_id FROM task_completions 
     WHERE DATE(completed_at) = DATE('now')
     AND task_id IN (SELECT id FROM tasks WHERE sector_id = ?)`
  ).bind(id).all();

  const completedTaskIds = new Set(completions.results.map((c: any) => c.task_id));
  const pendingTasks = tasks.results.filter((t: any) => !completedTaskIds.has(t.id));

  return c.json({
    ...sector,
    total_tasks: tasks.results.length,
    pending_tasks: pendingTasks.length,
    completed_tasks: completions.results.length,
  });
});

// Create sector (admin only)
sectors.post('/', adminMiddleware, zValidator('json', sectorSchema), async (c) => {
  const data = c.req.valid('json');

  const result = await c.env.DB.prepare(
    'INSERT INTO sectors (name, description, icon, color, order_number) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    data.name,
    data.description || null,
    data.icon || null,
    data.color || null,
    data.order_number || 0
  ).run();

  const sector = await c.env.DB.prepare(
    'SELECT * FROM sectors WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json(sector, 201);
});

// Update sector (admin only)
sectors.put('/:id', adminMiddleware, zValidator('json', sectorSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  await c.env.DB.prepare(
    'UPDATE sectors SET name = ?, description = ?, icon = ?, color = ?, order_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(
    data.name,
    data.description || null,
    data.icon || null,
    data.color || null,
    data.order_number || 0,
    id
  ).run();

  const sector = await c.env.DB.prepare(
    'SELECT * FROM sectors WHERE id = ?'
  ).bind(id).first();

  if (!sector) {
    return c.json({ error: 'Sector not found' }, 404);
  }

  return c.json(sector);
});

// Delete sector (admin only)
sectors.delete('/:id', adminMiddleware, async (c) => {
  const id = c.req.param('id');

  await c.env.DB.prepare(
    'DELETE FROM sectors WHERE id = ?'
  ).bind(id).run();

  return c.json({ message: 'Sector deleted successfully' });
});

export default sectors;
