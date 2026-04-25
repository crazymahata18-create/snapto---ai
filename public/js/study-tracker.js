/**
 * SnapTo AI — Study Tracker Core Logic
 * Real-time webcam-based study/screen-time tracker using face-api.js
 */

const StudyTracker = (() => {

  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    running: false,
    modelLoaded: false,
    stream: null,
    detectionLoop: null,
    timerLoop: null,
    pomodoroLoop: null,

    // Timers (in seconds)
    session: 0,
    study: 0,
    distracted: 0,
    away: 0,

    // Current status
    status: 'loading', // 'loading' | 'studying' | 'distracted' | 'away'
    continuousStudy: 0,  // seconds of uninterrupted study for Pomodoro

    // Hourly breakdown [hour: { study, distracted }]
    hourly: {},

    // Pomodoro
    pomodoroPhase: 'study', // 'study' | 'break'
    pomodoroRemaining: 25 * 60,
    pomodoroCount: 0,
    pomoDuration: 25,  // minutes (configurable)
    breakDuration: 5,

    // Settings
    sensitivity: 'medium',  // low | medium | high
    breakReminders: true,
    mirrorFeed: true,

    // Persisted
    storageKey: 'snapto_study_session',
    lastSaveDate: null,

    // FPS tracking
    frameCount: 0,
    lastFpsTime: Date.now(),
    fps: 0,
  };

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  let video, canvas, ctx;

  // Sensitivity thresholds (nose deviation ratio from face center)
  const thresholds = { low: 0.20, medium: 0.14, high: 0.09 };

  // ─── Init ─────────────────────────────────────────────────────────────────
  async function init() {
    video = document.getElementById('tracker-video');
    canvas = document.getElementById('tracker-canvas');
    ctx = canvas.getContext('2d');

    loadFromStorage();
    updateAllUI();
    startFpsCounter();

    try {
      setStatus('loading');
      updateStatusOverlay('loading', '⟳ LOADING AI MODELS...');
      log('Loading face detection models...');

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(
          'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
        ),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(
          'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
        ),
      ]);

      state.modelLoaded = true;
      log('AI models loaded ✓');
      updateStatusOverlay('loading', '● READY — CLICK START');
      setButtonStates(false);
    } catch (err) {
      console.error('[Tracker] Model load error:', err);
      updateStatusOverlay('away', '✕ MODEL LOAD FAILED — CHECK CONNECTION');
      log('Error loading models. Check your internet connection.', true);
    }
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  async function start() {
    if (!state.modelLoaded) {
      log('Models not ready yet, please wait...', true);
      return;
    }
    if (state.running) return;

    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });

      video.srcObject = state.stream;
      await new Promise(resolve => { video.onloadedmetadata = resolve; });
      await video.play();

      // Hide placeholder
      const placeholder = document.getElementById('camera-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      state.running = true;
      setButtonStates(true);
      setStatus('away');
      updateStatusOverlay('away', '● DETECTING...');
      log('Camera started. Face detection active.');

      // Sync canvas size
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Start loops
      startDetectionLoop();
      startTimerLoop();
      startPomodoroLoop();

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        log('Camera permission denied. Please allow camera access.', true);
        updateStatusOverlay('away', '✕ CAMERA PERMISSION DENIED');
      } else {
        log('Camera error: ' + err.message, true);
        updateStatusOverlay('away', '✕ CAMERA ERROR');
      }
    }
  }

  // ─── Stop ─────────────────────────────────────────────────────────────────
  function stop() {
    if (!state.running) return;
    state.running = false;

    // Stop loops
    if (state.detectionLoop) { clearTimeout(state.detectionLoop); state.detectionLoop = null; }
    if (state.timerLoop) { clearInterval(state.timerLoop); state.timerLoop = null; }
    if (state.pomodoroLoop) { clearInterval(state.pomodoroLoop); state.pomodoroLoop = null; }

    // Stop camera
    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
      state.stream = null;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Show placeholder
    const placeholder = document.getElementById('camera-placeholder');
    if (placeholder) placeholder.style.display = 'flex';

    setButtonStates(false);
    setStatus('loading');
    updateStatusOverlay('loading', '■ STOPPED');
    saveToStorage();
    log('Session paused. Data saved.');
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    stop();
    state.session = 0;
    state.study = 0;
    state.distracted = 0;
    state.away = 0;
    state.continuousStudy = 0;
    state.hourly = {};
    state.pomodoroPhase = 'study';
    state.pomodoroRemaining = state.pomoDuration * 60;
    state.pomodoroCount = 0;

    localStorage.removeItem(state.storageKey);
    updateAllUI();
    updateStatusOverlay('loading', '↺ RESET — CLICK START');
    log('Session reset.');

    // Hide break toast
    document.getElementById('break-toast').classList.remove('visible');
  }

  // ─── Detection Loop ───────────────────────────────────────────────────────
  function startDetectionLoop() {
    const detect = async () => {
      if (!state.running) return;

      try {
        const result = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);

        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!result) {
          setStatus('away');
          updateStatusOverlay('away', '✕ NO FACE DETECTED');
        } else {
          // Draw bounding box
          drawDetection(result);

          // Determine if studying (looking at screen)
          const isStudying = checkGaze(result.landmarks);

          if (isStudying) {
            setStatus('studying');
            updateStatusOverlay('studying', '● STUDYING');
          } else {
            setStatus('distracted');
            updateStatusOverlay('distracted', '◈ DISTRACTED');
          }
        }

        // Track FPS
        state.frameCount++;
        const now = Date.now();
        if (now - state.lastFpsTime >= 1000) {
          state.fps = state.frameCount;
          state.frameCount = 0;
          state.lastFpsTime = now;
          const el = document.getElementById('fps-counter');
          if (el) el.textContent = `${state.fps} FPS · face-api.js`;
        }

      } catch (e) {
        // Silently continue on frame errors
      }

      // Adaptive delay: ~2 FPS to be gentle on CPU
      state.detectionLoop = setTimeout(detect, 500);
    };

    detect();
  }

  // ─── Gaze Check ───────────────────────────────────────────────────────────
  function checkGaze(landmarks) {
    // Use nose tip and face bounding box to estimate head pose
    const nose = landmarks.getNose()[3]; // tip of nose
    const jaw = landmarks.getJawOutline();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const faceLeft = jaw[0].x;
    const faceRight = jaw[16].x;
    const faceWidth = faceRight - faceLeft;
    const faceCenter = faceLeft + faceWidth / 2;

    // Normalize nose position relative to face width
    const deviation = Math.abs(nose.x - faceCenter) / faceWidth;

    // Eye openness — both eyes should be visible
    const leftEyeH = Math.abs(leftEye[1].y - leftEye[5].y);
    const rightEyeH = Math.abs(rightEye[1].y - rightEye[5].y);
    const eyesOpen = leftEyeH > 2 && rightEyeH > 2;

    const threshold = thresholds[state.sensitivity] ?? thresholds.medium;
    return deviation < threshold && eyesOpen;
  }

  // ─── Draw Detection ───────────────────────────────────────────────────────
  function drawDetection(result) {
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    const box = result.detection.box;
    const isStudying = state.status === 'studying';
    const color = isStudying ? '#00ff9d' : state.status === 'distracted' ? '#ffb800' : '#ff2d55';

    ctx.save();

    // Bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    const x = box.x * scaleX;
    const y = box.y * scaleY;
    const w = box.width * scaleX;
    const h = box.height * scaleY;

    // Corner lines instead of full rect (cyberpunk style)
    const c = 18;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
    // Top-right
    ctx.moveTo(x + w - c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + c);
    // Bottom-left
    ctx.moveTo(x, y + h - c); ctx.lineTo(x, y + h); ctx.lineTo(x + c, y + h);
    // Bottom-right
    ctx.moveTo(x + w - c, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - c);
    ctx.stroke();

    // Landmarks (eyes only)
    ctx.shadowBlur = 4;
    ctx.fillStyle = color;
    const eyes = [...result.landmarks.getLeftEye(), ...result.landmarks.getRightEye()];
    eyes.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x * scaleX, pt.y * scaleY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Nose bridge line
    const nose = result.landmarks.getNose();
    ctx.strokeStyle = `${color}80`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(nose[0].x * scaleX, nose[0].y * scaleY);
    nose.forEach(pt => ctx.lineTo(pt.x * scaleX, pt.y * scaleY));
    ctx.stroke();

    ctx.restore();
  }

  // ─── Timer Loop ───────────────────────────────────────────────────────────
  function startTimerLoop() {
    state.timerLoop = setInterval(() => {
      if (!state.running) return;

      const hour = new Date().getHours();
      if (!state.hourly[hour]) state.hourly[hour] = { study: 0, distracted: 0 };

      state.session++;

      if (state.status === 'studying') {
        state.study++;
        state.continuousStudy++;
        state.hourly[hour].study++;
      } else if (state.status === 'distracted') {
        state.distracted++;
        state.continuousStudy = 0;
        state.hourly[hour].distracted++;
      } else {
        state.away++;
        state.continuousStudy = 0;
      }

      updateTimers();
      updateScoreRing();
      updateHourlyChart();

      // Auto-save every 30s
      if (state.session % 30 === 0) saveToStorage();

      // Break reminder check
      const breakThresholdSec = state.pomoDuration * 60;
      if (state.continuousStudy === breakThresholdSec && state.breakReminders) {
        showBreakToast();
      }

    }, 1000);
  }

  // ─── Pomodoro Loop ────────────────────────────────────────────────────────
  function startPomodoroLoop() {
    updatePomodoroUI();
    state.pomodoroLoop = setInterval(() => {
      if (!state.running) return;

      state.pomodoroRemaining--;
      updatePomodoroUI();

      if (state.pomodoroRemaining <= 0) {
        if (state.pomodoroPhase === 'study') {
          state.pomodoroPhase = 'break';
          state.pomodoroRemaining = state.breakDuration * 60;
          state.pomodoroCount++;
          if (state.breakReminders) showBreakToast();
        } else {
          state.pomodoroPhase = 'study';
          state.pomodoroRemaining = state.pomoDuration * 60;
        }
        updatePomodoroUI();
      }
    }, 1000);
  }

  // ─── UI Updates ───────────────────────────────────────────────────────────
  function setStatus(s) {
    state.status = s;
    const card = document.querySelector('.status-card');
    const val = document.getElementById('status-value');
    const sub = document.getElementById('status-sub');
    if (!card || !val) return;

    card.className = 'status-card ' + s;
    val.className = 'status-value ' + s;

    const labels = {
      studying: ['● STUDYING', 'Face detected — focused on screen'],
      distracted: ['◈ DISTRACTED', 'Face detected — looking away from screen'],
      away: ['✕ AWAY', 'No face detected at camera'],
      loading: ['⟳ LOADING', 'Initializing AI models...'],
    };
    val.textContent = labels[s][0];
    if (sub) sub.textContent = labels[s][1];

    // Update live badge
    const dot = document.getElementById('status-dot');
    const liveText = document.getElementById('live-text');
    if (dot && liveText) {
      dot.className = 'live-dot ' + (s === 'studying' ? '' : s === 'distracted' ? 'amber' : 'red');
      liveText.textContent = s === 'studying' ? 'LIVE' : s.toUpperCase();
    }
  }

  function updateStatusOverlay(s, text) {
    const el = document.getElementById('face-status-overlay');
    if (!el) return;
    el.className = 'face-status-overlay ' + s;
    el.textContent = text;
  }

  function updateTimers() {
    setText('timer-session', formatTime(state.session));
    setText('timer-study', formatTime(state.study));
    setText('timer-distracted', formatTime(state.distracted));
    setText('timer-away', formatTime(state.away));

    // Progress bars (% of session)
    if (state.session > 0) {
      setBarWidth('bar-study', (state.study / state.session) * 100);
      setBarWidth('bar-distracted', (state.distracted / state.session) * 100);
      setBarWidth('bar-away', (state.away / state.session) * 100);
    }

    // Active timer highlight
    document.querySelectorAll('.timer-item').forEach(el => el.classList.remove('active-timer'));
    const activeMap = { studying: 'item-study', distracted: 'item-distracted', away: 'item-away' };
    const activeEl = document.getElementById(activeMap[state.status]);
    if (activeEl) activeEl.classList.add('active-timer');
  }

  function updateScoreRing() {
    const score = state.session > 0 ? Math.round((state.study / state.session) * 100) : 0;

    // SVG ring: circumference ~226px for r=36
    const circumference = 226;
    const offset = circumference - (circumference * score / 100);
    const ring = document.getElementById('ring-progress');
    if (ring) {
      ring.style.strokeDashoffset = offset;
      ring.style.stroke = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';
    }

    setText('ring-pct', `${score}%`);
    setText('score-study-val', formatTime(state.study));
    setText('score-distracted-val', formatTime(state.distracted));
    setText('score-away-val', formatTime(state.away));
  }

  function updateHourlyChart() {
    const container = document.getElementById('hourly-chart');
    if (!container) return;

    container.innerHTML = '';
    const now = new Date().getHours();
    const hoursToShow = 8;

    for (let i = hoursToShow - 1; i >= 0; i--) {
      const h = (now - i + 24) % 24;
      const data = state.hourly[h] || { study: 0, distracted: 0 };
      const total = data.study + data.distracted;
      const maxSec = 3600;

      const studyH = Math.max(total > 0 ? (data.study / maxSec) * 88 : 0, total > 0 ? 2 : 0);
      const distractH = Math.max(total > 0 ? (data.distracted / maxSec) * 88 : 0, total > 0 ? 2 : 0);

      const col = document.createElement('div');
      col.className = 'hour-col';

      const bars = document.createElement('div');
      bars.className = 'hour-bars';

      const sb = document.createElement('div');
      sb.className = 'hour-bar study-bar';
      sb.style.height = `${studyH}px`;
      sb.title = `${h}:00 — Study: ${formatTime(data.study)}`;

      const db2 = document.createElement('div');
      db2.className = 'hour-bar distracted-bar';
      db2.style.height = `${distractH}px`;
      db2.title = `${h}:00 — Distracted: ${formatTime(data.distracted)}`;

      bars.appendChild(sb);
      bars.appendChild(db2);

      const label = document.createElement('div');
      label.className = 'hour-label';
      label.textContent = `${h}:00`;

      col.appendChild(bars);
      col.appendChild(label);
      container.appendChild(col);
    }
  }

  function updatePomodoroUI() {
    const el = document.getElementById('pomo-time');
    if (el) el.textContent = formatTime(state.pomodoroRemaining, true);

    const phase = document.getElementById('pomo-phase');
    if (phase) {
      phase.textContent = state.pomodoroPhase === 'study' ? 'FOCUS SESSION' : 'BREAK TIME';
      phase.style.color = state.pomodoroPhase === 'study' ? 'var(--cyan)' : 'var(--green)';
    }

    const count = document.getElementById('pomo-count');
    if (count) count.textContent = `Completed: ${state.pomodoroCount} / 4 sessions`;

    // Ring progress
    const circumference = 176;
    const total = state.pomodoroPhase === 'study' ? state.pomoDuration * 60 : state.breakDuration * 60;
    const offset = circumference * (1 - state.pomodoroRemaining / total);
    const ring = document.getElementById('pomo-progress');
    if (ring) {
      ring.style.strokeDashoffset = offset;
      ring.style.stroke = state.pomodoroPhase === 'study' ? 'var(--cyan)' : 'var(--green)';
    }

    // Dots
    const dots = document.querySelectorAll('.pomo-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('done', i < state.pomodoroCount % 4);
    });
  }

  function updateAllUI() {
    updateTimers();
    updateScoreRing();
    updateHourlyChart();
    updatePomodoroUI();
  }

  // ─── Break Toast ──────────────────────────────────────────────────────────
  function showBreakToast() {
    const toast = document.getElementById('break-toast');
    if (!toast) return;
    const msg = document.getElementById('break-toast-msg');
    if (msg) {
      msg.textContent = state.pomodoroPhase === 'break'
        ? `You've been studying for ${state.pomoDuration} minutes straight. Time for a ${state.breakDuration}-minute break! Stand up, stretch, and rest your eyes.`
        : `Break time is over. Ready to focus again? Your next study session starts now.`;
    }
    toast.classList.add('visible');
  }

  function closeBreakToast() {
    document.getElementById('break-toast').classList.remove('visible');
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  function openSettings() {
    document.getElementById('settings-modal').classList.add('open');
    document.getElementById('setting-sensitivity').value = state.sensitivity;
    document.getElementById('setting-pomo').value = state.pomoDuration;
    document.getElementById('setting-break').value = state.breakDuration;
    document.getElementById('setting-reminders').checked = state.breakReminders;
  }

  function closeSettings() {
    // Read values
    state.sensitivity = document.getElementById('setting-sensitivity').value;
    state.pomoDuration = parseInt(document.getElementById('setting-pomo').value);
    state.breakDuration = parseInt(document.getElementById('setting-break').value);
    state.breakReminders = document.getElementById('setting-reminders').checked;

    // Reset pomodoro with new durations
    state.pomodoroRemaining = state.pomodoroPhase === 'study' ? state.pomoDuration * 60 : state.breakDuration * 60;
    updatePomodoroUI();

    document.getElementById('settings-modal').classList.remove('open');
    log(`Settings saved: sensitivity=${state.sensitivity}, pomodoro=${state.pomoDuration}min`);
  }

  // ─── Storage ──────────────────────────────────────────────────────────────
  function saveToStorage() {
    const today = new Date().toDateString();
    const data = {
      date: today,
      session: state.session,
      study: state.study,
      distracted: state.distracted,
      away: state.away,
      hourly: state.hourly,
      pomodoroCount: state.pomodoroCount,
    };
    localStorage.setItem(state.storageKey, JSON.stringify(data));
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(state.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      const today = new Date().toDateString();
      if (data.date !== today) return; // Different day — start fresh

      state.session = data.session || 0;
      state.study = data.study || 0;
      state.distracted = data.distracted || 0;
      state.away = data.away || 0;
      state.hourly = data.hourly || {};
      state.pomodoroCount = data.pomodoroCount || 0;
      log(`Restored today's session: ${formatTime(state.study)} study time`);
    } catch (e) {
      // Ignore storage errors
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function formatTime(seconds, short = false) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (short) return `${pad(m)}:${pad(s)}`;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setBarWidth(id, pct) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Math.min(pct, 100)}%`;
  }

  function resizeCanvas() {
    if (!video || !canvas) return;
    const rect = video.getBoundingClientRect();
    canvas.width = video.videoWidth || rect.width;
    canvas.height = video.videoHeight || rect.height;
  }

  function setButtonStates(running) {
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    if (btnStart) btnStart.disabled = running;
    if (btnStop) btnStop.disabled = !running;
  }

  function log(msg, isError = false) {
    const el = document.getElementById('tracker-log');
    if (!el) return;
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const line = document.createElement('div');
    line.style.cssText = `font-family:var(--font-mono);font-size:0.58rem;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.03);color:${isError ? 'var(--red)' : 'var(--muted)'}`;
    line.innerHTML = `<span style="color:rgba(0,229,255,0.4)">${now}</span>&nbsp;&nbsp;${msg}`;
    el.prepend(line);
    while (el.children.length > 12) el.removeChild(el.lastChild);
  }

  function startFpsCounter() {
    setInterval(() => {
      if (!state.running) {
        const el = document.getElementById('fps-counter');
        if (el) el.textContent = 'face-api.js v0.22';
      }
    }, 2000);
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return { init, start, stop, reset, openSettings, closeSettings, closeBreakToast };

})();

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => StudyTracker.init());
