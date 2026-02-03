import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware
dashboard.use('*', authMiddleware);

// Get dashboard statistics
dashboard.get('/stats', async (c) => {
  const today = new Date().getDay();

  // Total tasks for today
  const totalTasksResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM tasks 
     WHERE days_of_week LIKE '%' || ? || '%' OR days_of_week = '[]'`
  ).bind(today.toString()).first();

  // Completed tasks today
  const completedTasksResult = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT task_id) as count FROM task_completions 
     WHERE DATE(completed_at) = DATE('now')`
  ).first();

  // Active sectors
  const activeSectorsResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM sectors'
  ).first();

  const totalTasks = (totalTasksResult?.count as number) || 0;
  const completedTasks = (completedTasksResult?.count as number) || 0;
  const activeSectors = (activeSectorsResult?.count as number) || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return c.json({
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: totalTasks - completedTasks,
    active_sectors: activeSectors,
    completion_rate: completionRate,
  });
});

// Get sectors with task counts
dashboard.get('/sectors', async (c) => {
  const today = new Date().getDay();

  const sectors = await c.env.DB.prepare(
    'SELECT * FROM sectors ORDER BY order_number ASC, name ASC'
  ).all();

  const sectorsWithStats = await Promise.all(
    sectors.results.map(async (sector: any) => {
      // Get tasks for today
      const tasksResult = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM tasks 
         WHERE sector_id = ? 
         AND (days_of_week LIKE '%' || ? || '%' OR days_of_week = '[]')`
      ).bind(sector.id, today.toString()).first();

      // Get completed tasks for today
      const completionsResult = await c.env.DB.prepare(
        `SELECT COUNT(DISTINCT task_id) as count FROM task_completions 
         WHERE DATE(completed_at) = DATE('now')
         AND task_id IN (SELECT id FROM tasks WHERE sector_id = ?)`
      ).bind(sector.id).first();

      const totalTasks = (tasksResult?.count as number) || 0;
      const completedTasks = (completionsResult?.count as number) || 0;

      return {
        ...sector,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: totalTasks - completedTasks,
      };
    })
  );

  return c.json(sectorsWithStats);
});

// Get recent completions
dashboard.get('/recent-completions', async (c) => {
  const limit = c.req.query('limit') || '10';

  const completions = await c.env.DB.prepare(
    `SELECT 
       tc.id, tc.task_id, tc.user_id, tc.completed_at, tc.photo_url, tc.notes,
       t.title as task_title, t.type as task_type,
       s.name as sector_name,
       u.name as user_name
     FROM task_completions tc
     JOIN tasks t ON tc.task_id = t.id
     JOIN sectors s ON t.sector_id = s.id
     JOIN users u ON tc.user_id = u.id
     WHERE DATE(tc.completed_at) = DATE('now')
     ORDER BY tc.completed_at DESC
     LIMIT ?`
  ).bind(limit).all();

  return c.json(completions.results);
});

export default dashboard;
