/**
 * SnapTo AI — Study Tracker API
 * Endpoints for saving/retrieving study session logs
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// ─── Ensure table exists ───────────────────────────────────────────────────
async function ensureTable() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      user_id TEXT DEFAULT 'anonymous',
      session_secs INTEGER DEFAULT 0,
      study_secs INTEGER DEFAULT 0,
      distracted_secs INTEGER DEFAULT 0,
      away_secs INTEGER DEFAULT 0,
      pomodoro_count INTEGER DEFAULT 0,
      hourly_data TEXT DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// ─── GET /api/tracker/today ─────────────────────────────────────────────────
// Returns today's session for the current user (or anonymous)
router.get('/today', async (req, res) => {
  try {
    await ensureTable();
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user?.id || 'anonymous';

    const row = await db.get(
      'SELECT * FROM study_sessions WHERE date = ? AND user_id = ?',
      [today, userId]
    );

    if (!row) {
      return res.json({ date: today, session_secs: 0, study_secs: 0, distracted_secs: 0, away_secs: 0, pomodoro_count: 0, hourly_data: {} });
    }

    res.json({
      ...row,
      hourly_data: JSON.parse(row.hourly_data || '{}')
    });
  } catch (err) {
    console.error('[Tracker] GET /today error:', err.message);
    res.status(500).json({ error: 'Failed to fetch session data.' });
  }
});

// ─── POST /api/tracker/session ──────────────────────────────────────────────
// Upserts today's session data
router.post('/session', async (req, res) => {
  try {
    await ensureTable();
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user?.id || 'anonymous';

    const {
      session_secs = 0,
      study_secs = 0,
      distracted_secs = 0,
      away_secs = 0,
      pomodoro_count = 0,
      hourly_data = {}
    } = req.body;

    const existing = await db.get(
      'SELECT id FROM study_sessions WHERE date = ? AND user_id = ?',
      [today, userId]
    );

    if (existing) {
      await db.run(
        `UPDATE study_sessions SET
          session_secs=?, study_secs=?, distracted_secs=?, away_secs=?,
          pomodoro_count=?, hourly_data=?, updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [session_secs, study_secs, distracted_secs, away_secs,
         pomodoro_count, JSON.stringify(hourly_data), existing.id]
      );
    } else {
      await db.run(
        `INSERT INTO study_sessions
          (date, user_id, session_secs, study_secs, distracted_secs, away_secs, pomodoro_count, hourly_data)
         VALUES (?,?,?,?,?,?,?,?)`,
        [today, userId, session_secs, study_secs, distracted_secs, away_secs,
         pomodoro_count, JSON.stringify(hourly_data)]
      );
    }

    res.json({ ok: true, date: today });
  } catch (err) {
    console.error('[Tracker] POST /session error:', err.message);
    res.status(500).json({ error: 'Failed to save session data.' });
  }
});

// ─── GET /api/tracker/history ───────────────────────────────────────────────
// Returns last 7 days of session summaries
router.get('/history', async (req, res) => {
  try {
    await ensureTable();
    const db = await getDb();
    const userId = req.user?.id || 'anonymous';

    const rows = await db.all(
      `SELECT date, session_secs, study_secs, distracted_secs, away_secs, pomodoro_count
       FROM study_sessions
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 7`,
      [userId]
    );

    res.json({ history: rows });
  } catch (err) {
    console.error('[Tracker] GET /history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

module.exports = router;
