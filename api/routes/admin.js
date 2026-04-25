const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

// Protect all admin routes
router.use(authMiddleware);

// GET /api/admin/leads
router.get('/leads', async (req, res) => {
  try {
    const db = await getDb();
    const leads = await db.all('SELECT * FROM leads ORDER BY created_at DESC');
    res.json({ success: true, leads });
  } catch (err) {
    console.error('[Admin API Error]', err);
    res.status(500).json({ error: 'Server error fetching leads' });
  }
});

// GET /api/admin/meetings
router.get('/meetings', async (req, res) => {
  try {
    const db = await getDb();
    const meetings = await db.all('SELECT * FROM meetings ORDER BY created_at DESC');
    res.json({ success: true, meetings });
  } catch (err) {
    console.error('[Admin API Error]', err);
    res.status(500).json({ error: 'Server error fetching meetings' });
  }
});

// GET /api/admin/monitoring-stats
router.get('/monitoring-stats', async (req, res) => {
  try {
    const db = await getDb();
    
    // Total Users
    const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
    
    // Total Leads (Emails)
    const leadsCount = await db.get('SELECT COUNT(*) as count FROM leads');
    
    // Recent Logins (Last 24h)
    const recentLogins = await db.get("SELECT COUNT(*) as count FROM users WHERE last_login > datetime('now', '-1 day')");
    
    // Live Users (from WebSocket)
    const wsClients = req.app.get('wsClients');
    const liveUsers = wsClients ? wsClients.size : 0;

    res.json({
      success: true,
      stats: {
        totalUsers: usersCount.count,
        totalLeads: leadsCount.count,
        recentLogins: recentLogins.count,
        liveUsers: liveUsers
      }
    });
  } catch (err) {
    console.error('[Admin Monitor Stats Error]', err);
    res.status(500).json({ error: 'Failed to fetch monitoring stats' });
  }
});

// GET /api/admin/users-list
router.get('/users-list', async (req, res) => {
  try {
    const db = await getDb();
    
    // Fetch all users with login info
    const users = await db.all(`
      SELECT id, username, name, role, last_login, created_at 
      FROM users 
      ORDER BY last_login DESC, created_at DESC
    `);
    
    // Fetch all leads (captured emails)
    const leads = await db.all('SELECT email, status, created_at FROM leads ORDER BY created_at DESC');

    res.json({ 
      success: true, 
      users,
      leads 
    });
  } catch (err) {
    console.error('[Admin User List Error]', err);
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
});

module.exports = router;
