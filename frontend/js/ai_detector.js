// AI Computer Vision Detection Visualizer for Jal Drishti

class AIDetectorVisualizer {
  constructor(canvasId) {
    this.canvasId = canvasId || 'aiCanvas';
    this.canvas = document.getElementById(this.canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.currentImage = null;
    this.detections = [];
    this.isScanning = false;
    this.scanCounter = 0;
    this.animationFrameId = null;
  }

  loadImage(imgSrc, detections, onComplete) {
    this.canvas = document.getElementById(this.canvasId) || document.getElementById('aiCanvas');
    if (this.canvas && !this.ctx) this.ctx = this.canvas.getContext('2d');
    if (!this.canvas || !this.ctx) {
      if (onComplete) onComplete();
      return;
    }

    // Cancel any active animation
    this.isScanning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const safeSrc = imgSrc || 'assets/sample_check_dam.jpg';
    const img = new Image();
    
    // NOTE: DO NOT set crossOrigin = "anonymous" because it triggers fatal CORS errors
    // on file:/// URLs and local hosts, blocking canvas drawImage completely.

    img.onload = () => {
      this.currentImage = img;
      const w = img.naturalWidth || img.width || 800;
      const h = img.naturalHeight || img.height || 500;
      this.canvas.width = Math.max(400, w);
      this.canvas.height = Math.max(250, h);
      this.detections = detections || [];
      this.startScanningEffect(onComplete);
    };

    img.onerror = () => {
      console.warn("Could not load image file directly:", safeSrc);
      this.renderFallbackCanvas(safeSrc, detections, onComplete);
    };

    img.src = safeSrc;
  }

  startScanningEffect(onComplete) {
    this.isScanning = true;
    const scanId = ++this.scanCounter;
    let scanY = 0;
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 500;
    const speed = Math.max(14, Math.floor(h / 24));
    const startTime = performance.now();
    const maxDurationMs = 1200; // Guaranteed completion within 1.2 seconds max

    const animateScan = (currentTime) => {
      if (scanId !== this.scanCounter || !this.isScanning) return;

      const elapsed = currentTime - startTime;

      // Draw base image
      if (this.currentImage) {
        this.ctx.drawImage(this.currentImage, 0, 0, w, h);
      }

      // Futuristic scanning laser line
      this.ctx.save();
      this.ctx.strokeStyle = '#06b6d4';
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = '#06b6d4';
      this.ctx.shadowBlur = 18;
      this.ctx.beginPath();
      this.ctx.moveTo(0, scanY);
      this.ctx.lineTo(w, scanY);
      this.ctx.stroke();

      // Scan overlay tint
      this.ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
      this.ctx.fillRect(0, 0, w, scanY);

      // Scanning HUD stats
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillStyle = '#67e8f9';
      this.ctx.fillText(`CV PROTOTYPE SCANNING: SCAN_LINE=${Math.round(scanY)}/${h}px`, 16, Math.min(scanY + 16, h - 14));
      this.ctx.restore();

      scanY += speed;
      if (scanY < h && elapsed < maxDurationMs) {
        this.animationFrameId = requestAnimationFrame(animateScan);
      } else {
        this.isScanning = false;
        this.animationFrameId = null;
        this.renderFinalDetections();
        if (onComplete) onComplete();
      }
    };

    this.animationFrameId = requestAnimationFrame(animateScan);
  }

  renderFinalDetections() {
    if (!this.ctx) return;
    const w = this.canvas.width || 800;
    const h = this.canvas.height || 500;

    // Draw base image
    if (this.currentImage) {
      this.ctx.drawImage(this.currentImage, 0, 0, w, h);
    }

    if (!this.detections || this.detections.length === 0) return;

    this.detections.forEach((det) => {
      const [xPct, yPct, wPct, hPct] = det.box;
      const x = (xPct / 100) * w;
      const y = (yPct / 100) * h;
      const boxW = (wPct / 100) * w;
      const boxH = (hPct / 100) * h;

      const isAlert = det.label.toLowerCase().includes('silt') || det.label.toLowerCase().includes('critical') || det.label.toLowerCase().includes('warning');
      const isWater = det.label.toLowerCase().includes('water') || det.label.toLowerCase().includes('reservoir') || det.label.toLowerCase().includes('pool') || det.label.toLowerCase().includes('infiltration');
      const boxColor = isAlert ? '#ef4444' : (isWater ? '#38bdf8' : '#10b981');
      const boxFill = isAlert ? 'rgba(239, 68, 68, 0.16)' : (isWater ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)');

      this.ctx.save();
      // Semi-transparent box fill
      this.ctx.fillStyle = boxFill;
      this.ctx.fillRect(x, y, boxW, boxH);

      // Bounding box border
      this.ctx.strokeStyle = boxColor;
      this.ctx.lineWidth = 2.5;
      this.ctx.strokeRect(x, y, boxW, boxH);

      // Corner brackets (target HUD)
      const corner = Math.min(16, boxW / 4, boxH / 4);
      this.ctx.lineWidth = 4.5;
      this.ctx.strokeStyle = boxColor;
      // Top-Left
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + corner); this.ctx.lineTo(x, y); this.ctx.lineTo(x + corner, y);
      this.ctx.stroke();
      // Top-Right
      this.ctx.beginPath();
      this.ctx.moveTo(x + boxW - corner, y); this.ctx.lineTo(x + boxW); this.ctx.lineTo(x + boxW, y + corner);
      this.ctx.stroke();
      // Bottom-Left
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + boxH - corner); this.ctx.lineTo(x, y + boxH); this.ctx.lineTo(x + corner, y + boxH);
      this.ctx.stroke();
      // Bottom-Right
      this.ctx.beginPath();
      this.ctx.moveTo(x + boxW - corner, y + boxH); this.ctx.lineTo(x + boxW, y + boxH); this.ctx.lineTo(x + boxW, y + boxH - corner);
      this.ctx.stroke();

      // Label background
      this.ctx.font = 'bold 13px Inter, sans-serif';
      const labelText = `${det.label} (${det.confidence}%)`;
      const textWidth = this.ctx.measureText(labelText).width;

      this.ctx.fillStyle = boxColor;
      this.ctx.fillRect(x, Math.max(0, y - 24), textWidth + 14, 24);

      // Label text
      this.ctx.fillStyle = '#04101e';
      this.ctx.fillText(labelText, x + 7, Math.max(16, y - 7));
      this.ctx.restore();
    });

    // Jal Drishti Telemetry Watermark
    this.ctx.save();
    this.ctx.font = '10.5px monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText('JAL DRISHTI • GEONEXA — COMPUTER VISION ANALYSIS (PROTOTYPE)', w - 380, h - 12);
    this.ctx.restore();
  }

  renderFallbackCanvas(imgSrc, detections, onComplete) {
    if (!this.ctx) return;
    const w = (this.canvas.width = 800);
    const h = (this.canvas.height = 500);

    // Dark grid background
    this.ctx.fillStyle = '#071526';
    this.ctx.fillRect(0, 0, w, h);

    // Tech grid
    this.ctx.strokeStyle = '#13273e';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, h); this.ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
    }

    // Title HUD
    this.ctx.font = 'bold 16px Inter, sans-serif';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚡ AI NEURAL ASSET SCANNER (GROUND EVIDENCE SIMULATION)', w / 2, h / 2 - 30);

    this.ctx.font = '13px Inter, sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillText(`Asset: ${imgSrc || 'Ground Field Structure Photo'}`, w / 2, h / 2);
    this.ctx.textAlign = 'left';

    this.detections = detections || [];
    this.renderFinalDetections();
    if (onComplete) onComplete();
  }
}
