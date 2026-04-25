/**
 * SnapTo AI — Camera Routes
 * GET  /api/cameras
 * GET  /api/cameras/:id
 * POST /api/cameras/:id/scan
 */

const express = require('express');
const { cameras } = require('../data/mockData');
const faceRecognition = require('../../ai/faceRecognition');

const router = express.Router();

// GET /api/cameras — List all cameras
router.get('/', (req, res) => {
  const { zone, status } = req.query;
  let result = [...cameras];

  if (zone) {
    result = result.filter(c => c.zone === zone.toUpperCase());
  }
  if (status) {
    result = result.filter(c => c.status === status);
  }

  res.json({
    cameras: result,
    stats: {
      total: cameras.length,
      active: cameras.filter(c => c.status === 'active').length,
      offline: cameras.filter(c => c.status === 'offline').length
    }
  });
});

// GET /api/cameras/:id — Single camera details
router.get('/:id', (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);

  if (!camera) {
    return res.status(404).json({ error: 'Camera not found.' });
  }

  // Get recent detections for this camera
  const recentDetections = faceRecognition.getRecentDetections(50)
    .filter(d => d.cameraId === camera.id)
    .slice(0, 10);

  res.json({ camera, recentDetections });
});

// POST /api/cameras/:id/scan — Trigger AI scan on camera
router.post('/:id/scan', (req, res) => {
  const result = faceRecognition.scanCamera(req.params.id);

  if (!result) {
    return res.status(404).json({ error: 'Camera not found.' });
  }

  res.json({
    success: true,
    scanResult: result,
    message: `Scan complete: ${result.faces.length} face(s) detected on ${result.cameraLabel}`
  });
});

module.exports = router;
