/**
 * AUTOMATION ROUTES
 * Endpoints para disparar el pipeline de automatización
 * GET  /api/automation/run        - Ejecutar pipeline ahora
 * GET  /api/automation/status     - Ver estado actual
 * GET  /api/automation/logs       - Ver logs recientes
 */

import express from 'express';
import AutomationOrchestrator from '../services/automation-orchestrator.js';

const router = express.Router();
const orchestrator = new AutomationOrchestrator();

let lastRunResult = null;
let lastRunTime = null;

// GET /api/automation/run
// Dispara el pipeline de automatización completo
router.get('/run', async (req, res) => {
  try {
    console.log('[AUTOMATION] Disparando pipeline...');
    
    const result = await orchestrator.runFullPipeline();
    
    lastRunResult = result;
    lastRunTime = new Date();
    
    res.json({
      success: result.success,
      message: 'Pipeline ejecutado',
      result: result.summary || { error: result.error },
      executed_at: lastRunTime.toISOString()
    });
    
  } catch (error) {
    console.error('[AUTOMATION ERROR]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/automation/status
// Ver estado del último run
router.get('/status', (req, res) => {
  res.json({
    last_run: lastRunTime ? lastRunTime.toISOString() : 'Nunca se ejecutó',
    last_result: lastRunResult || null,
    automation_enabled: true,
    schedule: 'Cada 6 horas',
    monitored_stores: 20,
    next_run_estimate: lastRunTime ? 
      new Date(lastRunTime.getTime() + 6*60*60*1000).toISOString() : 
      'N/A'
  });
});

// GET /api/automation/logs
// Ver logs de las últimas ejecuciones
router.get('/logs', (req, res) => {
  res.json({
    message: 'Logs del sistema de automatización',
    last_run: {
      time: lastRunTime,
      result: lastRunResult
    },
    automation_status: 'ACTIVO',
    monitored_tiendas: 20
  });
});

export default router;
