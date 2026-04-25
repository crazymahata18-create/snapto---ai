/**
 * SnapTo AI — Analytics Routes
 * GET /api/analytics/snapshot
 * GET /api/analytics/productivity
 * GET /api/analytics/hourly
 * GET /api/analytics/departments
 */

const express = require('express');
const { generateAnalyticsSnapshot, employees, departments } = require('../data/mockData');
const alertEngine = require('../../ai/alertEngine');

const router = express.Router();

// GET /api/analytics/snapshot — Full analytics snapshot
router.get('/snapshot', (req, res) => {
  const snapshot = generateAnalyticsSnapshot();
  snapshot.alertStats = alertEngine.getStats();
  res.json(snapshot);
});

// GET /api/analytics/productivity — Productivity score
router.get('/productivity', (req, res) => {
  const working = employees.filter(e => e.status === 'working').length;
  const total = employees.filter(e => e.status !== 'absent').length;
  const score = total > 0 ? Math.round((working / total) * 100) : 0;

  res.json({
    score,
    working,
    total,
    trend: Math.random() > 0.5 ? 'up' : 'stable',
    comparedToYesterday: `+${Math.floor(Math.random() * 8)}%`
  });
});

// GET /api/analytics/hourly — Hourly activity breakdown
router.get('/hourly', (req, res) => {
  const snapshot = generateAnalyticsSnapshot();
  res.json({ hourlyActivity: snapshot.hourlyActivity });
});

// GET /api/analytics/departments — Department breakdown
router.get('/departments', (req, res) => {
  const deptData = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    return {
      department: dept,
      headcount: deptEmployees.length,
      working: deptEmployees.filter(e => e.status === 'working').length,
      onBreak: deptEmployees.filter(e => e.status === 'break').length,
      idle: deptEmployees.filter(e => e.status === 'idle').length,
      absent: deptEmployees.filter(e => e.status === 'absent').length,
      productivity: deptEmployees.length > 0
        ? Math.round((deptEmployees.filter(e => e.status === 'working').length / deptEmployees.length) * 100)
        : 0
    };
  }).filter(d => d.headcount > 0);

  res.json({ departments: deptData });
});

module.exports = router;
