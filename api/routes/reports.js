/**
 * SnapTo AI — Report Routes
 * GET  /api/reports
 * POST /api/reports/generate
 * POST /api/reports/daily
 */

const express = require('express');
const reportGenerator = require('../../ai/reportGenerator');

const router = express.Router();

// GET /api/reports — List all reports
router.get('/', (req, res) => {
  const { type, limit } = req.query;
  const filters = {};
  if (type) filters.type = type;
  if (limit) filters.limit = parseInt(limit) || 20;

  const reports = reportGenerator.getReports(filters);
  res.json({ reports, total: reports.length });
});

// POST /api/reports/generate — Generate incident report from alert
router.post('/generate', (req, res) => {
  const { alertId } = req.body;

  if (!alertId) {
    return res.status(400).json({ error: 'alertId is required.' });
  }

  const report = reportGenerator.generateIncidentReport(alertId);

  if (!report) {
    return res.status(404).json({ error: 'Alert not found.' });
  }

  res.status(201).json({ success: true, report });
});

// POST /api/reports/daily — Generate daily summary report
router.post('/daily', (req, res) => {
  const report = reportGenerator.generateDailyReport();
  res.status(201).json({ success: true, report });
});

module.exports = router;
