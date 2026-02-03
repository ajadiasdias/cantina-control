import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const reports = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware
reports.use('*', authMiddleware);

// Get report data with filters
reports.get('/', async (c) => {
  const period = c.req.query('period') || '7'; // days
  const sectorId = c.req.query('sector_id');

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  let baseQuery = `
    SELECT DATE(tc.completed_at) as date, COUNT(*) as count
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE DATE(tc.completed_at) >= DATE('now', '-' || ? || ' days')
  `;
  const bindings: any[] = [period];

  if (sectorId) {
    baseQuery += ' AND t.sector_id = ?';
    bindings.push(sectorId);
  }

  baseQuery += ' GROUP BY DATE(tc.completed_at) ORDER BY date ASC';

  // Get completions over time
  const stmt = c.env.DB.prepare(baseQuery);
  const completionsOverTime = await stmt.bind(...bindings).all();

  // Get completions by sector
  let sectorQuery = `
    SELECT s.name, s.color, COUNT(tc.id) as count
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    JOIN sectors s ON t.sector_id = s.id
    WHERE DATE(tc.completed_at) >= DATE('now', '-' || ? || ' days')
  `;
  const sectorBindings: any[] = [period];

  if (sectorId) {
    sectorQuery += ' AND s.id = ?';
    sectorBindings.push(sectorId);
  }

  sectorQuery += ' GROUP BY s.id, s.name, s.color ORDER BY count DESC';

  const sectorStmt = c.env.DB.prepare(sectorQuery);
  const completionsBySector = await sectorStmt.bind(...sectorBindings).all();

  // Get completions by type
  let typeQuery = `
    SELECT t.type, COUNT(tc.id) as count
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    WHERE DATE(tc.completed_at) >= DATE('now', '-' || ? || ' days')
  `;
  const typeBindings: any[] = [period];

  if (sectorId) {
    typeQuery += ' AND t.sector_id = ?';
    typeBindings.push(sectorId);
  }

  typeQuery += ' GROUP BY t.type ORDER BY count DESC';

  const typeStmt = c.env.DB.prepare(typeQuery);
  const completionsByType = await typeStmt.bind(...typeBindings).all();

  // Get summary statistics
  let statsQuery = `
    SELECT 
      COUNT(DISTINCT tc.task_id) as completed_tasks,
      COUNT(DISTINCT t.id) as total_tasks
    FROM tasks t
    LEFT JOIN task_completions tc ON t.id = tc.task_id 
      AND DATE(tc.completed_at) >= DATE('now', '-' || ? || ' days')
    WHERE 1=1
  `;
  const statsBindings: any[] = [period];

  if (sectorId) {
    statsQuery += ' AND t.sector_id = ?';
    statsBindings.push(sectorId);
  }

  const statsStmt = c.env.DB.prepare(statsQuery);
  const stats = await statsStmt.bind(...statsBindings).first();

  const completedTasks = (stats?.completed_tasks as number) || 0;
  const totalTasks = (stats?.total_tasks as number) || 0;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return c.json({
    period: parseInt(period),
    sector_id: sectorId ? parseInt(sectorId) : null,
    summary: {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      completion_rate: completionRate,
    },
    completions_over_time: completionsOverTime.results,
    completions_by_sector: completionsBySector.results,
    completions_by_type: completionsByType.results,
  });
});

// Get latest completions with details
reports.get('/latest', async (c) => {
  const limit = c.req.query('limit') || '20';
  const sectorId = c.req.query('sector_id');

  let query = `
    SELECT 
      tc.id, tc.completed_at, tc.photo_url, tc.notes,
      t.title as task_title, t.type as task_type,
      s.name as sector_name, s.color as sector_color,
      u.name as user_name
    FROM task_completions tc
    JOIN tasks t ON tc.task_id = t.id
    JOIN sectors s ON t.sector_id = s.id
    JOIN users u ON tc.user_id = u.id
    WHERE 1=1
  `;
  const bindings: any[] = [];

  if (sectorId) {
    query += ' AND s.id = ?';
    bindings.push(sectorId);
  }

  query += ' ORDER BY tc.completed_at DESC LIMIT ?';
  bindings.push(limit);

  const stmt = c.env.DB.prepare(query);
  const result = await stmt.bind(...bindings).all();

  return c.json(result.results);
});

export default reports;
