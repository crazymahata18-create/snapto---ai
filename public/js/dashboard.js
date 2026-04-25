/**
 * SnapTo AI — Dashboard Controller
 * Main dashboard interactivity, API integration, and WebSocket handling
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let ws = null;
  let employees = [];
  let cameras = [];
  let alerts = [];
  let selectedCamera = null;

  // DOM refs
  const clockEl = document.getElementById('dash-clock');
  const employeeList = document.getElementById('employee-list');
  const alertsList = document.getElementById('alerts-list');
  const cameraGrid = document.getElementById('camera-grid');
  const chartBars = document.getElementById('chart-bars');
  const floorPlan = document.getElementById('floor-plan');
  const metricProductivity = document.getElementById('metric-productivity');
  const metricAlerts = document.getElementById('metric-alerts');
  const metricWorkTime = document.getElementById('metric-worktime');
  const metricOnline = document.getElementById('metric-online');
  const metricBreak = document.getElementById('metric-break');
  const reportsList = document.getElementById('reports-list');
  const toastContainer = document.getElementById('toast-container');
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');
  const scanModal = document.getElementById('scan-modal');
  const notifBadge = document.getElementById('notif-badge');

  // ─── Init ────────────────────────────────────────────────
  init();

  async function init() {
    // Require auth first
    if (!Auth.requireAuth()) return;

    // Set user info
    const user = Auth.getUser();
    if (user && userNameEl) {
      userNameEl.textContent = user.name || user.username;
      if (userAvatarEl) userAvatarEl.textContent = (user.name || 'U').substring(0, 2).toUpperCase();
    }

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Load data
    await Promise.all([loadEmployees(), loadCameras(), loadAlerts(), loadAnalytics()]);

    // WebSocket
    connectWebSocket();

    // Refresh data periodically
    setInterval(loadAnalytics, 10000);
    setInterval(loadEmployees, 8000);
  }

  // ─── Clock ───────────────────────────────────────────────
  function updateClock() {
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
  }

  // ─── Employees ───────────────────────────────────────────
  async function loadEmployees() {
    try {
      const data = await API.getEmployees();
      employees = data.employees;
      renderEmployees(employees);
      updateSidebarStats(data.stats);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  }

  function renderEmployees(emps) {
    if (!employeeList) return;
    const statusOrder = { working: 0, idle: 1, break: 2, absent: 3 };
    const sorted = [...emps].sort((a, b) => (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9));

    employeeList.innerHTML = sorted.slice(0, 12).map(e => `
      <div class="employee-row" data-id="${e.id}">
        <div class="emp-avatar" style="background:${e.color}22;color:${e.color};">${e.initials}</div>
        <div class="emp-info">
          <div class="emp-name">${e.name}</div>
          <div class="emp-role">${e.role}</div>
        </div>
        <div class="emp-status-dot" style="background:${statusColor(e.status)};box-shadow:0 0 8px ${statusColor(e.status)};"></div>
      </div>
    `).join('');
  }

  function updateSidebarStats(stats) {
    if (metricOnline) metricOnline.textContent = `${stats.working + stats.idle}/${stats.total}`;
    if (metricBreak) metricBreak.textContent = stats.break;
  }

  function statusColor(status) {
    return { working: '#00ff9d', break: '#ffb800', idle: '#7c4dff', absent: '#ff2d55' }[status] || '#5a7d8a';
  }

  // ─── Cameras ─────────────────────────────────────────────
  async function loadCameras() {
    try {
      const data = await API.getCameras();
      cameras = data.cameras;
      renderCameras(cameras.slice(0, 4));
    } catch (err) {
      console.error('Failed to load cameras', err);
    }
  }

  function renderCameras(cams) {
    if (!cameraGrid) return;
    cameraGrid.innerHTML = cams.map((cam, i) => {
      const isAlert = cam.id === 'CAM-03';
      const imgFilter = isAlert ? 'grayscale(20%) brightness(0.9)' : 'brightness(0.9)';
      return `
      <div class="camera-cell ${isAlert ? 'alert' : ''}" data-cam-id="${cam.id}" onclick="Dashboard.scanCamera('${cam.id}')">
        <div class="cam-label" style="z-index:10;">${cam.label}</div>
        <div class="cam-rec" style="z-index:10;">REC</div>
        <div class="scan-line" style="animation-delay:${i * 0.6}s; z-index:10;"></div>
        <canvas class="cam-canvas" id="canvas-${cam.id}" style="z-index:15;"></canvas>
        <div class="cam-feed">
          <div class="cam-sim" style="overflow:hidden; position:relative;">
            <img src="/img/real_cam${(i % 4) + 1}.png" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; filter:${imgFilter}; z-index:0; animation: dashboardPan 15s infinite alternate ease-in-out;">
            <div class="cam-noise" style="z-index:1;"></div>
            ${isAlert ? `
              <div class="target-box" style="left:55%;top:30%;border-color:var(--red); z-index:2;"></div>
              <div style="position:absolute;bottom:12px;left:8px;right:8px;background:rgba(255,45,85,0.2);border:1px solid rgba(255,45,85,0.5);padding:5px 8px;font-family:var(--font-mono);font-size:0.5rem;color:var(--red);z-index:4;">⚠ UNKNOWN FACE DETECTED</div>
            ` : ''}
          </div>
        </div>
        <div class="cam-scan-overlay" style="z-index:20;"><span>CLICK TO SCAN</span></div>
      </div>`;
    }).join('');
  }

  // ─── Event Listeners ─────────────────────────────────────
  
  // Navigation Tabs
  document.querySelectorAll('.dash-nav-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      // Update active state
      document.querySelectorAll('.dash-nav-item').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      // Hide all views
      document.querySelectorAll('.dash-main').forEach(v => v.style.display = 'none');
      
      const viewId = e.target.getAttribute('data-view');
      if (viewId === 'overview') {
        document.getElementById('view-overview').style.display = 'flex';
      } else if (viewId === 'customers') {
        document.getElementById('view-customers').style.display = 'block';
        await loadCustomersView();
      } else if (viewId === 'settings') {
        document.getElementById('view-settings').style.display = 'block';
        loadSettingsView();
      } else {
        // Fallback for unimplemented tabs
        document.getElementById('view-overview').style.display = 'flex';
        showToast('This tab is under construction.', 'ok');
      }
    });
  });

  async function loadCustomersView() {
    try {
      const [leadsRes, meetingsRes] = await Promise.all([
        API.getLeads(),
        API.getMeetings()
      ]);

      const leadsBody = document.getElementById('leads-table-body');
      if (leadsRes.leads && leadsRes.leads.length > 0) {
        leadsBody.innerHTML = leadsRes.leads.map(l => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:10px; color:var(--muted);">${l.id}</td>
            <td style="padding:10px; color:var(--white);">${l.email}</td>
            <td style="padding:10px; color:var(--cyan);">${l.status.toUpperCase()}</td>
            <td style="padding:10px; color:var(--muted);">${new Date(l.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('');
      } else {
        leadsBody.innerHTML = '<tr><td colspan="4" style="padding:10px; color:var(--muted);">No waitlist signups yet.</td></tr>';
      }

      const meetingsBody = document.getElementById('meetings-table-body');
      if (meetingsRes.meetings && meetingsRes.meetings.length > 0) {
        meetingsBody.innerHTML = meetingsRes.meetings.map(m => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:10px; color:var(--green);">${m.date} at ${m.time}</td>
            <td style="padding:10px; color:var(--white);">${m.name}</td>
            <td style="padding:10px; color:var(--muted);">${m.company}</td>
            <td style="padding:10px; color:var(--cyan);">${m.email}</td>
          </tr>
        `).join('');
      } else {
        meetingsBody.innerHTML = '<tr><td colspan="4" style="padding:10px; color:var(--muted);">No meetings scheduled yet.</td></tr>';
      }

    } catch (err) {
      console.error('Failed to load customers data', err);
    }
  }

  function loadSettingsView() {
    const user = Auth.getUser();
    if (!user) return;

    const name = user.name || user.username || 'User';
    const username = user.username || 'admin';
    const role = (user.role || 'viewer').toUpperCase();
    const initials = name.substring(0, 2).toUpperCase();

    // Populate account card
    const avatarEl = document.getElementById('settings-avatar');
    const nameEl = document.getElementById('settings-name');
    const usernameEl = document.getElementById('settings-username');
    const roleEl = document.getElementById('settings-role');
    const sessionEl = document.getElementById('settings-session-time');

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = name;
    if (usernameEl) usernameEl.textContent = '@' + username;
    if (roleEl) {
      roleEl.textContent = role;
      roleEl.style.color = role === 'ADMIN' ? 'var(--green)' : 'var(--cyan)';
      roleEl.style.borderColor = role === 'ADMIN' ? 'rgba(0,255,157,0.3)' : 'rgba(0,229,255,0.3)';
      roleEl.style.background = role === 'ADMIN' ? 'rgba(0,255,157,0.08)' : 'rgba(0,229,255,0.08)';
    }
    if (sessionEl) {
      const now = new Date();
      sessionEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
  }

  // ─── Change Password ──────────────────────────────────────
  Dashboard.changePassword = async function() {
    const currentPw = document.getElementById('settings-current-pw')?.value;
    const newPw = document.getElementById('settings-new-pw')?.value;
    const confirmPw = document.getElementById('settings-confirm-pw')?.value;
    const msgEl = document.getElementById('settings-pw-msg');

    if (!currentPw || !newPw || !confirmPw) {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--red)'; msgEl.style.background = 'rgba(255,45,85,0.1)'; msgEl.style.border = '1px solid rgba(255,45,85,0.3)'; msgEl.textContent = '⚠ Please fill in all password fields.'; }
      return;
    }
    if (newPw !== confirmPw) {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--red)'; msgEl.style.background = 'rgba(255,45,85,0.1)'; msgEl.style.border = '1px solid rgba(255,45,85,0.3)'; msgEl.textContent = '⚠ New passwords do not match.'; }
      return;
    }
    if (newPw.length < 6) {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--amber)'; msgEl.style.background = 'rgba(255,184,0,0.08)'; msgEl.style.border = '1px solid rgba(255,184,0,0.3)'; msgEl.textContent = '⚠ Password must be at least 6 characters.'; }
      return;
    }

    try {
      const token = Auth.getToken();
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      const data = await res.json();
      if (data.success) {
        if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--green)'; msgEl.style.background = 'rgba(0,255,157,0.08)'; msgEl.style.border = '1px solid rgba(0,255,157,0.3)'; msgEl.textContent = '✓ Password updated successfully!'; }
        document.getElementById('settings-current-pw').value = '';
        document.getElementById('settings-new-pw').value = '';
        document.getElementById('settings-confirm-pw').value = '';
      } else {
        if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--red)'; msgEl.style.background = 'rgba(255,45,85,0.1)'; msgEl.style.border = '1px solid rgba(255,45,85,0.3)'; msgEl.textContent = '⚠ ' + (data.error || 'Failed to update password.'); }
      }
    } catch (err) {
      if (msgEl) { msgEl.style.display = 'block'; msgEl.style.color = 'var(--red)'; msgEl.style.background = 'rgba(255,45,85,0.1)'; msgEl.style.border = '1px solid rgba(255,45,85,0.3)'; msgEl.textContent = '⚠ Network error. Please try again.'; }
    }
  };

  // ─── Bind globals for inline handlers ───────────────────
  window.Dashboard = {
    logout: Auth.logout,
    generateDailyReport,
    scanCamera,
    changePassword: Dashboard.changePassword,
    savePreference: function(key, value) {
      localStorage.setItem('snapto_pref_' + key, value);
    }
  };

  // ─── Scan Camera ─────────────────────────────────────────
  window.Dashboard = window.Dashboard || {};
  Dashboard.scanCamera = async function(camId) {
    if (!scanModal) return;
    selectedCamera = camId;
    const cam = cameras.find(c => c.id === camId);

    // Show modal with processing
    scanModal.style.display = 'flex';
    document.getElementById('scan-modal-title').textContent = `AI SCAN — ${cam ? cam.label : camId}`;
    document.getElementById('scan-results').innerHTML = `
      <div class="scan-processing">
        <div class="scanner-ring"></div>
        <span>PROCESSING FRAME...</span>
      </div>
    `;

    // Animate canvas scan
    const canvas = document.getElementById(`canvas-${camId}`);
    if (canvas) AIVisualizer.animateScan(canvas, 1500);

    // Call API
    try {
      await new Promise(r => setTimeout(r, 1800)); // Wait for animation
      const data = await API.scanCamera(camId);
      renderScanResults(data.scanResult);

      // Draw detections on canvas
      if (canvas) {
        setTimeout(() => AIVisualizer.drawDetections(canvas, data.scanResult.faces), 300);
      }
    } catch (err) {
      document.getElementById('scan-results').innerHTML = `<div class="scan-processing"><span style="color:var(--red);">SCAN FAILED — ${err.message}</span></div>`;
    }
  };

  Dashboard.closeScan = function() {
    if (scanModal) scanModal.style.display = 'none';
    // Clear canvases
    if (selectedCamera) {
      const canvas = document.getElementById(`canvas-${selectedCamera}`);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  function renderScanResults(result) {
    const el = document.getElementById('scan-results');
    if (!el) return;

    el.innerHTML = result.faces.map(face => {
      const isUnknown = face.type === 'unknown';
      return `
      <div class="scan-result-item">
        <div class="scan-face-icon" style="background:${isUnknown ? 'rgba(255,45,85,0.15)' : 'rgba(0,229,255,0.15)'};color:${isUnknown ? 'var(--red)' : 'var(--cyan)'};">
          ${isUnknown ? '??' : (face.employeeName || 'UK').substring(0, 2).toUpperCase()}
        </div>
        <div class="scan-result-info">
          <div class="scan-result-name" style="color:${isUnknown ? 'var(--red)' : 'var(--white)'};">
            ${isUnknown ? '⚠ UNKNOWN INDIVIDUAL' : face.employeeName}
          </div>
          <div class="scan-result-detail">
            ${isUnknown
              ? `Est. Age: ${face.features.age} | ${face.features.gender} | THREAT LEVEL: HIGH`
              : `ID: ${face.employeeId} | Verified Employee`}
          </div>
        </div>
        <div class="scan-result-confidence" style="color:${isUnknown ? 'var(--red)' : 'var(--green)'};">
          ${face.confidence}%
        </div>
      </div>`;
    }).join('');
  }

  // ─── Alerts ──────────────────────────────────────────────
  async function loadAlerts() {
    try {
      const data = await API.getAlerts({ limit: 15 });
      alerts = data.alerts;
      renderAlerts(alerts.slice(0, 8));

      const stats = await API.getAlertStats();
      if (metricAlerts) metricAlerts.textContent = stats.today || 0;
    } catch (err) {
      console.error('Failed to load alerts', err);
    }
  }

  function renderAlerts(alertList) {
    if (!alertsList) return;
    alertsList.innerHTML = alertList.map(a => `
      <div class="alert-item ${a.severity}">
        <div class="a-time">${a.timeString} — ${a.cameraLabel || 'SYSTEM'}</div>
        <div class="a-msg">${a.description}</div>
      </div>
    `).join('');
  }

  function addNewAlert(alert) {
    alerts.unshift(alert);
    renderAlerts(alerts.slice(0, 8));

    // Toast notification for danger alerts
    if (alert.severity === 'danger') {
      showToast(alert.description, 'danger');
      if (notifBadge) notifBadge.style.display = 'block';
    }

    // Update metric
    if (metricAlerts) {
      const current = parseInt(metricAlerts.textContent) || 0;
      metricAlerts.textContent = current + 1;
    }
  }

  // ─── Analytics ───────────────────────────────────────────
  async function loadAnalytics() {
    try {
      const data = await API.getSnapshot();

      if (metricProductivity) metricProductivity.textContent = data.productivityScore + '%';
      if (metricWorkTime) metricWorkTime.textContent = (5 + Math.random() * 2.5).toFixed(1) + 'h';

      renderChart(data.hourlyActivity);
      renderFloorPlan(data);
      renderReports();
    } catch (err) {
      console.error('Failed to load analytics', err);
    }
  }

  function renderChart(hourlyData) {
    if (!chartBars) return;
    const currentHour = new Date().getHours();

    chartBars.innerHTML = hourlyData.map((h, i) => {
      const isCurrent = h.hour.replace(/[APM]/g, '') == (currentHour > 12 ? currentHour - 12 : currentHour);
      const isLunch = h.hour === '12PM' || h.hour === '1PM';
      let barColor = 'linear-gradient(to top, rgba(0,229,255,0.8), rgba(0,229,255,0.2))';
      if (isLunch) barColor = 'linear-gradient(to top, rgba(255,184,0,0.8), rgba(255,184,0,0.2))';
      if (isCurrent) barColor = 'linear-gradient(to top, rgba(0,229,255,0.4), rgba(0,229,255,0.1))';

      return `
      <div class="bar-wrap">
        <div class="bar" style="height:${h.value}%;background:${barColor};animation-delay:${i * 0.05}s;${isCurrent ? 'box-shadow:none;' : ''}"></div>
        <div class="bar-label">${isCurrent ? 'NOW' : h.hour}</div>
      </div>`;
    }).join('');
  }

  function renderFloorPlan(data) {
    if (!floorPlan) return;

    // Generate moving dots based on employee status
    const positions = [
      { x: 15, y: 35 }, { x: 22, y: 55 }, { x: 30, y: 40 }, { x: 12, y: 60 },
      { x: 25, y: 30 }, { x: 18, y: 50 }, { x: 35, y: 45 },
      { x: 65, y: 30 }, { x: 72, y: 50 }, { x: 80, y: 40 }, { x: 75, y: 65 },
    ];

    const dotsHTML = positions.map((pos, i) => {
      const status = i < data.working ? 'working' : (i < data.working + data.onBreak ? 'break' : 'idle');
      const color = statusColor(status);
      return `<div class="floor-dot" style="left:${pos.x + Math.random() * 4 - 2}%;top:${pos.y + Math.random() * 4 - 2}%;background:${color};box-shadow:0 0 8px ${color};${status === 'idle' ? 'animation:alertPulse 1.5s infinite;' : ''}"></div>`;
    }).join('');

    floorPlan.innerHTML = `
      <div class="floor-zone" style="width:42%;height:60%;top:20%;left:4%;">FLOOR A</div>
      <div class="floor-zone" style="width:42%;height:60%;top:20%;right:4%;">FLOOR B</div>
      ${dotsHTML}
      <div class="floor-legend">
        <span><span class="floor-legend-dot" style="background:var(--green);"></span> Working</span>
        <span><span class="floor-legend-dot" style="background:var(--amber);"></span> Break</span>
        <span><span class="floor-legend-dot" style="background:var(--red);"></span> Alert</span>
      </div>
    `;
  }

  async function renderReports() {
    if (!reportsList) return;
    try {
      const data = await API.getReports({ limit: 5 });
      reportsList.innerHTML = data.reports.map(r => `
        <div class="report-item">📄 ${r.id} → ${r.sentTo ? r.sentTo[0] : 'Pending'}</div>
      `).join('') || '<div class="report-item" style="color:var(--muted);">No reports yet</div>';
    } catch {
      reportsList.innerHTML = '<div class="report-item">📄 Incident #0047 → Director Sharma</div><div class="report-item">📄 Daily Report → HR Department</div>';
    }
  }

  // ─── WebSocket ───────────────────────────────────────────
  function connectWebSocket() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${location.host}/ws`);

    ws.onopen = () => console.log('[WS] Connected');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'newAlert':
            addNewAlert(data.alert);
            break;

          case 'statusUpdate':
            if (data.employees) {
              data.employees.forEach(update => {
                const emp = employees.find(e => e.id === update.id);
                if (emp) {
                  emp.status = update.status;
                  emp.location = update.location;
                  emp.breakMinutes = update.breakMinutes;
                }
              });
              renderEmployees(employees);
            }
            break;

          case 'alertResolved':
            const idx = alerts.findIndex(a => a.id === data.alert.id);
            if (idx !== -1) alerts[idx] = data.alert;
            break;
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in 3s');
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }

  // ─── Toast Notifications ─────────────────────────────────
  function showToast(message, type = 'ok') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-dot"></div><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // ─── Generate Report Button ──────────────────────────────
  Dashboard.generateDailyReport = async function() {
    try {
      const data = await API.generateDailyReport();
      showToast('Daily report generated and sent to management', 'ok');
      renderReports();
    } catch (err) {
      showToast('Failed to generate report: ' + err.message, 'danger');
    }
  };

  // ─── Search ──────────────────────────────────────────────
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      if (!q) {
        renderEmployees(employees);
        return;
      }
      const filtered = employees.filter(emp =>
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
      renderEmployees(filtered);
    });
  }

  // ─── Logout ──────────────────────────────────────────────
  Dashboard.logout = function() {
    Auth.logout();
  };
});
