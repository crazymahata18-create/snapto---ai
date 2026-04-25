const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { sendBookingConfirmation, sendPreOrderConfirmation } = require('../utils/emailService');

// POST /api/public/leads (Waitlist Pre-order)
router.post('/leads', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const db = await getDb();
    
    // Check if email exists
    const existing = await db.get('SELECT * FROM leads WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already on waitlist' });
    }

    await db.run('INSERT INTO leads (email) VALUES (?)', [email]);
    
    // Send confirmation email
    await sendPreOrderConfirmation(email);
    
    res.json({ success: true, message: 'Added to priority waitlist' });
  } catch (err) {
    console.error('[Leads API Error]', err);
    res.status(500).json({ error: 'Server error adding lead' });
  }
});

// POST /api/public/meetings
router.post('/meetings', async (req, res) => {
  try {
    const { name, email, company, date, time } = req.body;
    
    if (!name || !email || !date || !time) {
      return res.status(400).json({ error: 'Missing required meeting details' });
    }

    const db = await getDb();
    
    // Check if slot is taken
    const existing = await db.get('SELECT * FROM meetings WHERE date = ? AND time = ?', [date, time]);
    if (existing) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    await db.run(
      'INSERT INTO meetings (name, email, company, date, time) VALUES (?, ?, ?, ?, ?)',
      [name, email, company, date, time]
    );

    // Send confirmation email
    await sendBookingConfirmation(email, name, date, time);

    res.json({ success: true, message: 'Meeting scheduled successfully' });
  } catch (err) {
    console.error('[Meetings API Error]', err);
    res.status(500).json({ error: 'Server error scheduling meeting' });
  }
});

// GET /api/public/meetings/booked
router.get('/meetings/booked', async (req, res) => {
  try {
    const db = await getDb();
    const meetings = await db.all('SELECT date, time FROM meetings');
    
    // Group by date for easier frontend consumption
    const bookedSlots = {};
    meetings.forEach(m => {
      if (!bookedSlots[m.date]) bookedSlots[m.date] = [];
      bookedSlots[m.date].push(m.time);
    });

    res.json({ success: true, bookedSlots });
  } catch (err) {
    console.error('[Meetings Fetch Error]', err);
    res.status(500).json({ error: 'Server error fetching meetings' });
  }
});

module.exports = router;
