import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT 1 AS status, PostGIS_Version() AS postgis_version;');
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        postgis: result.rows[0]?.postgis_version || 'unknown',
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Database error',
      },
    });
  }
});

export default router;
