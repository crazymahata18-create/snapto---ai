/**
 * SnapTo AI — AI Visualizer
 * Canvas-based AI detection overlay renderer
 */

const AIVisualizer = (() => {

  function drawDetections(canvas, faces) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    faces.forEach((face, i) => {
      const box = face.boundingBox;
      const x = (box.x / 100) * w;
      const y = (box.y / 100) * h;
      const bw = (box.width / 100) * w;
      const bh = (box.height / 100) * h;

      const isUnknown = face.type === 'unknown';
      const color = isUnknown ? '#ff2d55' : '#00e5ff';

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, bw, bh);

      // Corner brackets
      const cornerLen = 8;
      ctx.lineWidth = 3;
      // Top-left
      ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
      // Top-right
      ctx.beginPath(); ctx.moveTo(x + bw - cornerLen, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + cornerLen); ctx.stroke();
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(x, y + bh - cornerLen); ctx.lineTo(x, y + bh); ctx.lineTo(x + cornerLen, y + bh); ctx.stroke();
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(x + bw - cornerLen, y + bh); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw, y + bh - cornerLen); ctx.stroke();

      // Label background
      const label = isUnknown ? `UNKNOWN ${face.confidence}%` : `${face.employeeName} ${face.confidence}%`;
      ctx.font = '10px "Space Mono", monospace';
      const textW = ctx.measureText(label).width + 10;
      ctx.fillStyle = isUnknown ? 'rgba(255,45,85,0.85)' : 'rgba(0,229,255,0.85)';
      ctx.fillRect(x, y - 18, textW, 16);

      // Label text
      ctx.fillStyle = isUnknown ? '#fff' : '#020608';
      ctx.fillText(label, x + 5, y - 6);

      // Scanning line animation effect
      if (isUnknown) {
        ctx.fillStyle = 'rgba(255,45,85,0.08)';
        ctx.fillRect(x, y, bw, bh);
      }
    });
  }

  function animateScan(canvas, duration = 1500) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, w, h);

      // Scanning line
      const lineY = progress * h;
      const gradient = ctx.createLinearGradient(0, lineY - 2, 0, lineY + 2);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, 'rgba(0,229,255,0.8)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, lineY - 2, w, 4);

      // Scan trail
      ctx.fillStyle = 'rgba(0,229,255,0.03)';
      ctx.fillRect(0, 0, w, lineY);

      // Grid overlay
      ctx.strokeStyle = 'rgba(0,229,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, lineY); ctx.stroke();
      }
      for (let y = 0; y < lineY; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Progress text
      ctx.fillStyle = 'rgba(0,229,255,0.7)';
      ctx.font = '11px "Space Mono", monospace';
      ctx.fillText(`SCANNING... ${Math.floor(progress * 100)}%`, 10, h - 10);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  return { drawDetections, animateScan };
})();
