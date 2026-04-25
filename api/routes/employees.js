/**
 * SnapTo AI — Employee Routes
 * GET /api/employees
 * GET /api/employees/:id
 */

const express = require('express');
const { employees } = require('../data/mockData');

const router = express.Router();

// GET /api/employees — List all employees
router.get('/', (req, res) => {
  const { status, department, search } = req.query;
  let result = [...employees];

  if (status) {
    result = result.filter(e => e.status === status);
  }
  if (department) {
    result = result.filter(e => e.department.toLowerCase() === department.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
  }

  const stats = {
    total: employees.length,
    working: employees.filter(e => e.status === 'working').length,
    break: employees.filter(e => e.status === 'break').length,
    idle: employees.filter(e => e.status === 'idle').length,
    absent: employees.filter(e => e.status === 'absent').length,
  };

  res.json({ employees: result, stats });
});

// GET /api/employees/:id — Single employee
router.get('/:id', (req, res) => {
  const employee = employees.find(e => e.id === req.params.id);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  res.json({ employee });
});

module.exports = router;
