/**
 * SnapTo AI — Alert Routes
 * GET  /api/alerts
 * GET  /api/alerts/stats
 * POST /api/alerts/:id/resolve
 */

const express = require('express');
const alertEngine = require('../../ai/alertEngine');

const router = express.Router();

// GET /api/alerts — List alerts with optional filters
router.get('/', (req, res) => {
  const { severity, type, resolved, limit } = req.query;

  const filters = {};
  if (severity) filters.severity = severity;
  if (type) filters.type = type;
  if (resolved !== undefined) filters.resolved = resolved === 'true';
  if (limit) filters.limit = parseInt(limit) || 50;

  const alerts = alertEngine.getAlerts(filters);
  res.json({ alerts, total: alerts.length });
});

// GET /api/alerts/stats — Alert statistics
router.get('/stats', (req, res) => {
  res.json(alertEngine.getStats());
});

// POST /api/alerts/:id/resolve — Resolve an alert
router.post('/:id/resolve', (req, res) => {
  const resolvedBy = req.body.resolvedBy || (req.user && req.user.name) || 'System';
  const alert = alertEngine.resolveAlert(req.params.id, resolvedBy);

  if (!alert) {
    return res.status(404).json({ error: 'Alert not found.' });
  }

  res.json({ success: true, alert });
});

module.exports = router;
