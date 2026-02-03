import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const tasks = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
tasks.use('*', authMiddleware);

const taskSchema = z.object({
  sector_id: z.number(),
  type: z.enum(['opening', 'general', 'closing']),
  title: z.string().min(1),
  description: z.string().optional(),
  is_required: z.boolean().optional(),
  requires_photo: z.boolean().optional(),
  estimated_time: z.number().optional(),
  order_number: z.number().optional(),
  days_of_week: z.string().optional(), // JSON array string
});

// Get all tasks (with optional filters)
tasks.get('/', async (c) => {
  const sectorId = c.req.query('sector_id');
  const type = c.req.query('type');
  const today = c.req.query('today'); // If 'true', filter by today's day of week

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const bindings: any[] = [];

  if (sectorId) {
    query += ' AND sector_id = ?';
    bindings.push(sectorId);
  }

  if (type) {
    query += ' AND type = ?';
    bindings.push(type);
  }

  if (today === 'true') {
    const dayOfWeek = new Date().getDay();
    query += ' AND (days_of_week LIKE ? OR days_of_week = "[]")';
    bindings.push(`%${dayOfWeek}%`);
  }

  query += ' ORDER BY sector_id, type, order_number';

  const stmt = c.env.DB.prepare(query);
  const result = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();

  return c.json(result.results);
});

// Get task by ID
tasks.get('/:id', async (c) => {
  const id = c.req.param('id');

  const task = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).first();

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json(task);
});

// Get tasks by sector (with completion status for today)
tasks.get('/sector/:sectorId', async (c) => {
  const sectorId = c.req.param('sectorId');
  const today = new Date().getDay();

  const tasksResult = await c.env.DB.prepare(
    `SELECT * FROM tasks 
     WHERE sector_id = ? 
     AND (days_of_week LIKE '%' || ? || '%' OR days_of_week = '[]')
     ORDER BY type, order_number`
  ).bind(sectorId, today.toString()).all();

  // Get completions for today
  const completionsResult = await c.env.DB.prepare(
    `SELECT task_id, user_id, completed_at, photo_url, notes 
     FROM task_completions 
     WHERE DATE(completed_at) = DATE('now')
     AND task_id IN (SELECT id FROM tasks WHERE sector_id = ?)`
  ).bind(sectorId).all();

  const completionsMap = new Map();
  completionsResult.results.forEach((c: any) => {
    completionsMap.set(c.task_id, c);
  });

  const tasksWithStatus = tasksResult.results.map((task: any) => ({
    ...task,
    completed: completionsMap.has(task.id),
    completion: completionsMap.get(task.id) || null,
  }));

  return c.json(tasksWithStatus);
});

// Create task (admin only)
tasks.post('/', adminMiddleware, zValidator('json', taskSchema), async (c) => {
  const data = c.req.valid('json');

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks 
     (sector_id, type, title, description, is_required, requires_photo, estimated_time, order_number, days_of_week) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.sector_id,
    data.type,
    data.title,
    data.description || null,
    data.is_required ? 1 : 0,
    data.requires_photo ? 1 : 0,
    data.estimated_time || null,
    data.order_number || 0,
    data.days_of_week || '[0,1,2,3,4,5,6]'
  ).run();

  const task = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json(task, 201);
});

// Update task (admin only)
tasks.put('/:id', adminMiddleware, zValidator('json', taskSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  await c.env.DB.prepare(
    `UPDATE tasks 
     SET sector_id = ?, type = ?, title = ?, description = ?, is_required = ?, 
         requires_photo = ?, estimated_time = ?, order_number = ?, days_of_week = ?, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).bind(
    data.sector_id,
    data.type,
    data.title,
    data.description || null,
    data.is_required ? 1 : 0,
    data.requires_photo ? 1 : 0,
    data.estimated_time || null,
    data.order_number || 0,
    data.days_of_week || '[0,1,2,3,4,5,6]',
    id
  ).run();

  const task = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).first();

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json(task);
});

// Delete task (admin only)
tasks.delete('/:id', adminMiddleware, async (c) => {
  const id = c.req.param('id');

  await c.env.DB.prepare(
    'DELETE FROM tasks WHERE id = ?'
  ).bind(id).run();

  return c.json({ message: 'Task deleted successfully' });
});

// Complete a task
const completeTaskSchema = z.object({
  photo_url: z.string().optional(),
  notes: z.string().optional(),
});

tasks.post('/:id/complete', zValidator('json', completeTaskSchema), async (c) => {
  const taskId = c.req.param('id');
  const data = c.req.valid('json');
  const user = c.get('user');

  // Check if task exists
  const task = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(taskId).first();

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  // Check if already completed today
  const existing = await c.env.DB.prepare(
    `SELECT id FROM task_completions 
     WHERE task_id = ? AND DATE(completed_at) = DATE('now')`
  ).bind(taskId).first();

  if (existing) {
    return c.json({ error: 'Task already completed today' }, 400);
  }

  // Create completion
  const result = await c.env.DB.prepare(
    'INSERT INTO task_completions (task_id, user_id, photo_url, notes) VALUES (?, ?, ?, ?)'
  ).bind(
    taskId,
    user.id,
    data.photo_url || null,
    data.notes || null
  ).run();

  const completion = await c.env.DB.prepare(
    'SELECT * FROM task_completions WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json(completion, 201);
});

// Uncomplete a task (remove completion for today)
tasks.delete('/:id/complete', async (c) => {
  const taskId = c.req.param('id');
  const user = c.get('user');

  await c.env.DB.prepare(
    `DELETE FROM task_completions 
     WHERE task_id = ? AND DATE(completed_at) = DATE('now')`
  ).bind(taskId).run();

  return c.json({ message: 'Task completion removed' });
});

export default tasks;
