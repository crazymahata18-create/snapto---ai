/**
 * SnapTo AI — Behavior Analysis Simulator
 * Simulates pose estimation, idle detection, and safety violation events
 */

const { getRandomEmployee, getRandomCamera, generateTimestamp, simulateStatusChanges } = require('../api/data/mockData');
const alertEngine = require('./alertEngine');

class BehaviorAnalysis {
  constructor() {
    this.interval = null;
    this.events = [];
    this.maxEvents = 300;
  }

  start(intervalMs = 8000) {
    if (this.interval) return;

    console.log('[AI] Behavior Analysis engine started');

    this.interval = setInterval(() => {
      this.analyzeFrame();
    }, intervalMs);

    // Seed initial events
    for (let i = 0; i < 3; i++) {
      this.analyzeFrame();
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[AI] Behavior Analysis engine stopped');
    }
  }

  analyzeFrame() {
    // Simulate status changes
    const changedEmployee = simulateStatusChanges();

    const eventType = this.pickEventType();
    const camera = getRandomCamera();
    const employee = getRandomEmployee();

    const event = {
      id: `BEH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: eventType,
      employeeId: employee.id,
      employeeName: employee.name,
      cameraId: camera.id,
      cameraLabel: camera.label,
      zone: camera.zone,
      timestamp: new Date().toISOString(),
      timeString: generateTimestamp(),
      confidence: (80 + Math.random() * 19).toFixed(1),
      poseData: this.generatePoseData(),
      details: this.getEventDetails(eventType, employee, camera)
    };

    this.events.unshift(event);

    // Create alerts for significant events
    if (eventType === 'idle' && Math.random() < 0.4) {
      const idleMinutes = Math.floor(Math.random() * 25 + 10);
      alertEngine.createAlert({
        type: 'idle',
        severity: 'warn',
        cameraId: camera.id,
        cameraLabel: camera.label,
        employeeId: employee.id,
        employeeName: employee.name,
        confidence: event.confidence,
        description: `${employee.name} (${employee.id}) idle for ${idleMinutes} minutes at ${camera.location}`,
        zone: camera.zone
      });
    }

    if (eventType === 'argument') {
      const emp2 = getRandomEmployee();
      alertEngine.createAlert({
        type: 'argument',
        severity: 'warn',
        cameraId: camera.id,
        cameraLabel: camera.label,
        employeeId: employee.id,
        employeeName: employee.name,
        confidence: event.confidence,
        description: `Heated argument detected between ${employee.name} & ${emp2.name} — ${camera.location}`,
        zone: camera.zone
      });
    }

    if (eventType === 'safety_violation') {
      alertEngine.createAlert({
        type: 'safety',
        severity: 'danger',
        cameraId: camera.id,
        cameraLabel: camera.label,
        employeeId: employee.id,
        employeeName: employee.name,
        confidence: event.confidence,
        description: `Safety protocol violation detected — ${employee.name} at ${camera.location}`,
        zone: camera.zone
      });
    }

    if (eventType === 'restricted_access') {
      alertEngine.createAlert({
        type: 'restricted_zone',
        severity: 'danger',
        cameraId: camera.id,
        cameraLabel: camera.label,
        employeeId: employee.id,
        employeeName: employee.name,
        confidence: event.confidence,
        description: `Unauthorized access: ${employee.name} entered restricted zone — ${camera.location}`,
        zone: camera.zone
      });
    }

    // Trim
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    return event;
  }

  pickEventType() {
    const types = [
      { type: 'normal', weight: 50 },
      { type: 'idle', weight: 20 },
      { type: 'break_return', weight: 12 },
      { type: 'argument', weight: 5 },
      { type: 'safety_violation', weight: 3 },
      { type: 'restricted_access', weight: 3 },
      { type: 'unusual_gathering', weight: 7 },
    ];

    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const t of types) {
      random -= t.weight;
      if (random <= 0) return t.type;
    }
    return 'normal';
  }

  generatePoseData() {
    return {
      headAngle: Math.floor(Math.random() * 40 - 20),
      bodyPosture: Math.random() > 0.3 ? 'upright' : 'slouched',
      movement: Math.random() > 0.5 ? 'active' : 'stationary',
      gestureType: ['typing', 'talking', 'walking', 'standing', 'sitting'][Math.floor(Math.random() * 5)]
    };
  }

  getEventDetails(type, employee, camera) {
    const details = {
      normal: `${employee.name} working normally at ${camera.location}`,
      idle: `${employee.name} appears idle at workstation — ${camera.location}`,
      break_return: `${employee.name} returned from break to ${camera.location}`,
      argument: `Aggressive gestures detected between individuals — ${camera.location}`,
      safety_violation: `Safety protocol breach detected — ${camera.location}`,
      restricted_access: `Unauthorized zone entry attempt — ${camera.location}`,
      unusual_gathering: `${Math.floor(Math.random() * 4 + 3)} people gathered unexpectedly — ${camera.location}`
    };
    return details[type] || `Activity logged at ${camera.location}`;
  }

  getRecentEvents(limit = 20) {
    return this.events.slice(0, limit);
  }
}

module.exports = new BehaviorAnalysis();
