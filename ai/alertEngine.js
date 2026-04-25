/**
 * SnapTo AI — Alert Engine
 * Event bus that aggregates AI detections into alerts and manages WebSocket broadcast
 */

const EventEmitter = require('events');

class AlertEngine extends EventEmitter {
  constructor() {
    super();
    this.alerts = [];
    this.maxAlerts = 200;
    this.alertIdCounter = 47; // start from a realistic number
  }

  createAlert({ type, severity, cameraId, cameraLabel, employeeId, employeeName, confidence, description, zone }) {
    const alert = {
      id: `INC-${String(++this.alertIdCounter).padStart(4, '0')}`,
      type,
      severity, // 'danger', 'warn', 'ok'
      cameraId: cameraId || null,
      cameraLabel: cameraLabel || null,
      employeeId: employeeId || null,
      employeeName: employeeName || null,
      confidence: confidence || (85 + Math.random() * 14.9).toFixed(1),
      description,
      zone: zone || 'A',
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null
    };

    this.alerts.unshift(alert);

    // Trim old alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    // Emit for WebSocket broadcast
    this.emit('newAlert', alert);

    return alert;
  }

  resolveAlert(alertId, resolvedBy = 'System') {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = resolvedBy;
      this.emit('alertResolved', alert);
      return alert;
    }
    return null;
  }

  getAlerts(filters = {}) {
    let result = [...this.alerts];

    if (filters.severity) {
      result = result.filter(a => a.severity === filters.severity);
    }
    if (filters.type) {
      result = result.filter(a => a.type === filters.type);
    }
    if (filters.resolved !== undefined) {
      result = result.filter(a => a.resolved === filters.resolved);
    }
    if (filters.cameraId) {
      result = result.filter(a => a.cameraId === filters.cameraId);
    }
    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayAlerts = this.alerts.filter(a => new Date(a.timestamp) >= todayStart);

    return {
      total: this.alerts.length,
      today: todayAlerts.length,
      danger: todayAlerts.filter(a => a.severity === 'danger').length,
      warn: todayAlerts.filter(a => a.severity === 'warn').length,
      ok: todayAlerts.filter(a => a.severity === 'ok').length,
      unresolved: todayAlerts.filter(a => !a.resolved).length
    };
  }
}

module.exports = new AlertEngine();
