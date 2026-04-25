/**
 * SnapTo AI — Report Generator
 * Compiles alerts and analytics into structured incident reports
 */

const alertEngine = require('./alertEngine');
const { generateAnalyticsSnapshot, employees } = require('../api/data/mockData');

class ReportGenerator {
  constructor() {
    this.reports = [];
    this.reportIdCounter = 46;
  }

  generateIncidentReport(alertId) {
    const alert = alertEngine.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    const report = {
      id: `RPT-${String(++this.reportIdCounter).padStart(4, '0')}`,
      type: 'incident',
      alertRef: alert.id,
      generatedAt: new Date().toISOString(),
      summary: {
        incidentType: alert.type,
        severity: alert.severity,
        location: alert.cameraLabel || 'Unknown',
        zone: alert.zone,
        timestamp: alert.timestamp,
        confidence: alert.confidence + '%'
      },
      subjects: alert.employeeId ? [{
        id: alert.employeeId,
        name: alert.employeeName,
        role: employees.find(e => e.id === alert.employeeId)?.role || 'Unknown'
      }] : [{ id: 'UNKNOWN', name: 'Unidentified Individual', role: 'N/A' }],
      evidence: {
        videoClip: `clip_${alert.cameraId}_${Date.now()}.mp4`,
        screenshots: [`snap_${Date.now()}_1.jpg`, `snap_${Date.now()}_2.jpg`],
        aiAnalysis: alert.description
      },
      recommendation: this.getRecommendation(alert.type, alert.severity),
      sentTo: this.getRecipients(alert.severity),
      status: 'sent'
    };

    this.reports.unshift(report);
    return report;
  }

  generateDailyReport() {
    const analytics = generateAnalyticsSnapshot();
    const todayAlerts = alertEngine.getAlerts({ limit: 50 });

    const report = {
      id: `RPT-${String(++this.reportIdCounter).padStart(4, '0')}`,
      type: 'daily',
      generatedAt: new Date().toISOString(),
      period: new Date().toISOString().split('T')[0],
      summary: {
        totalPresent: analytics.totalPresent,
        totalAbsent: analytics.absent,
        productivityScore: analytics.productivityScore + '%',
        alertsRaised: todayAlerts.length,
        criticalAlerts: todayAlerts.filter(a => a.severity === 'danger').length,
        averageBreakTime: Math.floor(Math.random() * 15 + 10) + ' minutes'
      },
      hourlyBreakdown: analytics.hourlyActivity,
      departmentPerformance: analytics.departmentBreakdown,
      alertSummary: todayAlerts.slice(0, 10).map(a => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        description: a.description,
        time: a.timeString
      })),
      sentTo: ['Director Sharma', 'HR Department', 'Operations Manager'],
      status: 'sent'
    };

    this.reports.unshift(report);
    return report;
  }

  getRecommendation(type, severity) {
    const recs = {
      unknown_face: 'Immediate security response required. Verify individual identity and escort if unauthorized.',
      idle: 'Manager notification sent. Recommend a check-in with the employee.',
      restricted_zone: 'Security alert escalated. Lock down restricted area and verify access credentials.',
      argument: 'HR notification sent. Recommend mediation and incident documentation.',
      safety: 'Safety team alerted. Area inspection required. Document for compliance records.',
      face_match: 'No action required. Routine verification logged.',
      attendance: 'No action required. Report archived.',
      break_over: 'No action required. Employee resumed work.',
      unusual_gathering: 'Monitor situation. Notify floor manager if persists beyond 10 minutes.',
      late_arrival: 'Log for attendance records. Notify team lead if pattern detected.'
    };
    return recs[type] || 'Review incident and take appropriate action.';
  }

  getRecipients(severity) {
    if (severity === 'danger') return ['Director Sharma', 'Security Lead', 'HR Manager'];
    if (severity === 'warn') return ['Team Lead', 'HR Manager'];
    return ['HR Department'];
  }

  getReports(filters = {}) {
    let result = [...this.reports];
    if (filters.type) result = result.filter(r => r.type === filters.type);
    if (filters.limit) result = result.slice(0, filters.limit);
    return result;
  }
}

module.exports = new ReportGenerator();
