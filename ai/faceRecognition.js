/**
 * SnapTo AI — Face Recognition Simulator
 * Generates realistic face detection events at configurable intervals
 */

const { getRandomEmployee, getRandomCamera, generateTimestamp } = require('../api/data/mockData');
const alertEngine = require('./alertEngine');

class FaceRecognition {
  constructor() {
    this.interval = null;
    this.detections = [];
    this.maxDetections = 500;
  }

  start(intervalMs = 4000) {
    if (this.interval) return;

    console.log('[AI] Face Recognition engine started');

    this.interval = setInterval(() => {
      this.processFrame();
    }, intervalMs);

    // Generate some initial detections
    for (let i = 0; i < 5; i++) {
      this.processFrame();
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[AI] Face Recognition engine stopped');
    }
  }

  processFrame() {
    const camera = getRandomCamera();
    const isUnknown = Math.random() < 0.08; // 8% chance of unknown face

    if (isUnknown) {
      const detection = {
        type: 'unknown',
        cameraId: camera.id,
        cameraLabel: camera.label,
        confidence: (88 + Math.random() * 10).toFixed(1),
        timestamp: new Date().toISOString(),
        timeString: generateTimestamp(),
        boundingBox: this.generateBoundingBox(),
        features: { age: Math.floor(25 + Math.random() * 30), gender: Math.random() > 0.5 ? 'Male' : 'Female' }
      };

      this.detections.unshift(detection);
      
      alertEngine.createAlert({
        type: 'unknown_face',
        severity: 'danger',
        cameraId: camera.id,
        cameraLabel: camera.label,
        confidence: detection.confidence,
        description: `Unknown face detected on ${camera.label} — Confidence: ${detection.confidence}%`,
        zone: camera.zone
      });
    } else {
      const employee = getRandomEmployee();
      const detection = {
        type: 'match',
        employeeId: employee.id,
        employeeName: employee.name,
        cameraId: camera.id,
        cameraLabel: camera.label,
        confidence: (96 + Math.random() * 3.9).toFixed(1),
        timestamp: new Date().toISOString(),
        timeString: generateTimestamp(),
        boundingBox: this.generateBoundingBox()
      };

      this.detections.unshift(detection);

      // Occasional positive alert
      if (Math.random() < 0.05) {
        alertEngine.createAlert({
          type: 'face_match',
          severity: 'ok',
          cameraId: camera.id,
          cameraLabel: camera.label,
          employeeId: employee.id,
          employeeName: employee.name,
          confidence: detection.confidence,
          description: `${employee.name} (${employee.id}) verified at ${camera.location}`,
          zone: camera.zone
        });
      }
    }

    // Trim old detections
    if (this.detections.length > this.maxDetections) {
      this.detections = this.detections.slice(0, this.maxDetections);
    }
  }

  generateBoundingBox() {
    const x = Math.floor(Math.random() * 60 + 20);
    const y = Math.floor(Math.random() * 40 + 15);
    return { x, y, width: Math.floor(25 + Math.random() * 15), height: Math.floor(30 + Math.random() * 20) };
  }

  getRecentDetections(limit = 20) {
    return this.detections.slice(0, limit);
  }

  scanCamera(cameraId) {
    const camera = require('../api/data/mockData').cameras.find(c => c.id === cameraId);
    if (!camera) return null;

    const results = [];
    const numFaces = Math.floor(Math.random() * 4 + 1);

    for (let i = 0; i < numFaces; i++) {
      const isUnknown = Math.random() < 0.15;
      if (isUnknown) {
        results.push({
          type: 'unknown',
          confidence: (85 + Math.random() * 12).toFixed(1),
          boundingBox: this.generateBoundingBox(),
          features: { age: Math.floor(20 + Math.random() * 40), gender: Math.random() > 0.5 ? 'Male' : 'Female' }
        });
      } else {
        const emp = getRandomEmployee();
        results.push({
          type: 'match',
          employeeId: emp.id,
          employeeName: emp.name,
          confidence: (95 + Math.random() * 4.9).toFixed(1),
          boundingBox: this.generateBoundingBox()
        });
      }
    }

    return { cameraId, cameraLabel: camera.label, scanTime: new Date().toISOString(), faces: results };
  }
}

module.exports = new FaceRecognition();
