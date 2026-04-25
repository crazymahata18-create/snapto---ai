/**
 * SnapTo AI — Main Server
 * Express + WebSocket server with AI simulation engine
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

// Import routes
const authRoutes = require('./api/routes/auth');
const employeeRoutes = require('./api/routes/employees');
const alertRoutes = require('./api/routes/alerts');
const analyticsRoutes = require('./api/routes/analytics');
const cameraRoutes = require('./api/routes/cameras');
const reportRoutes = require('./api/routes/reports');
const publicRoutes = require('./api/routes/public');
const adminRoutes = require('./api/routes/admin');
const trackerRoutes = require('./api/routes/tracker');
const { getDb } = require('./api/db/database');

// Import AI engines
const alertEngine = require('./ai/alertEngine');
const faceRecognition = require('./ai/faceRecognition');
const behaviorAnalysis = require('./ai/behaviorAnalysis');

// Import middleware
const rateLimit = require('./api/middleware/rateLimit');
const { optionalAuth } = require('./api/middleware/auth');

const app = express();
const server = http.createServer(app);

// ─── WebSocket Setup ────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });

const wsClients = new Set();
app.set('wsClients', wsClients);

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[WS] Client connected (total: ${wsClients.size})`);

  // Send initial data
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to SnapTo AI real-time feed',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WS] Client disconnected (total: ${wsClients.size})`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
    wsClients.delete(ws);
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of wsClients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  }
}

// Listen for alert engine events and broadcast
alertEngine.on('newAlert', (alert) => {
  broadcast({ type: 'newAlert', alert });
});

alertEngine.on('alertResolved', (alert) => {
  broadcast({ type: 'alertResolved', alert });
});

// Broadcast employee status updates periodically
setInterval(() => {
  const { employees, simulateStatusChanges } = require('./api/data/mockData');
  
  // Simulate 1-3 changes every interval
  const changeCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < changeCount; i++) {
    simulateStatusChanges();
  }

  const statusUpdate = employees.map(e => ({
    id: e.id,
    status: e.status,
    location: e.location,
    breakMinutes: e.breakMinutes
  }));

  broadcast({
    type: 'statusUpdate',
    employees: statusUpdate,
    timestamp: new Date().toISOString()
  });
}, 5000);

// ─── Express Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(rateLimit(60000, 200)); // 200 requests per minute

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Optional auth for all API routes
app.use('/api', optionalAuth);

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracker', trackerRoutes);

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    uptime: process.uptime(),
    ai: {
      faceRecognition: 'active',
      behaviorAnalysis: 'active',
      alertEngine: 'active'
    },
    websocket: { clients: wsClients.size },
    timestamp: new Date().toISOString()
  });
});

// API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// SPA fallback — serve index.html for non-API, non-file routes
app.get('*', (req, res) => {
  // If requesting a specific file that exists, Express static already handles it
  // Otherwise serve index.html
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  // Initialize Database
  await getDb();
  console.log('[Server] SQLite Database initialized');

  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║          SnapTo AI — Server Running              ║');
  console.log('  ╠══════════════════════════════════════════════════╣');
  console.log(`  ║  🌐 http://localhost:${PORT}                       ║`);
  console.log(`  ║  📊 http://localhost:${PORT}/dashboard.html        ║`);
  console.log(`  ║  📚 http://localhost:${PORT}/study-tracker.html    ║`);
  console.log(`  ║  🔑 http://localhost:${PORT}/login.html            ║`);
  console.log(`  ║  🔌 ws://localhost:${PORT}/ws                      ║`);
  console.log(`  ║  📡 http://localhost:${PORT}/api/health             ║`);
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');

  // Start AI engines
  faceRecognition.start(4000);   // Process frame every 4 seconds
  behaviorAnalysis.start(8000);  // Analyze behavior every 8 seconds

  console.log('[Server] AI engines initialized');
  console.log('[Server] WebSocket ready on /ws');
  console.log('');
});

function getWsClientCount() {
  return wsClients.size;
}

module.exports = { app, server, getWsClientCount };
