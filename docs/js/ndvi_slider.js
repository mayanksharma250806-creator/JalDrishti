// Jal Drishti • Geo Nexa: Remote Sensing NDVI Split Comparison Engine
// Full multi-spectral analysis with clip-path split slider, animated sweep, and pixel NDVI probing

const NDVI_PROJECT_DATA = {
  'WD-204': {
    name: 'Chhata Micro-Watershed Development',
    district: 'Mathura',
    state: 'Uttar Pradesh',
    lat: 27.7182,
    lng: 77.5028,
    before_ndvi: 0.21,
    after_ndvi: 0.58,
    gain_pct: '+176%',
    area_restored: '420 Hectares',
    biomass_gain: '+2,410 Metric Tons',
    soil_moisture: '+34%',
    desc: 'Check dam cascading system restored downstream alluvial soil moisture and agricultural double-cropping.'
  },
  'WD-118': {
    name: 'Fatehabad Arid Land Watershed Project',
    district: 'Agra',
    state: 'Uttar Pradesh',
    lat: 27.0200,
    lng: 78.3100,
    before_ndvi: 0.16,
    after_ndvi: 0.32,
    gain_pct: '+100%',
    area_restored: '310 Hectares',
    biomass_gain: '+1,120 Metric Tons',
    soil_moisture: '+22%',
    desc: 'Percolation trenches and field contour bunds stabilized ravine erosion near the Yamuna river basin.'
  },
  'WD-311': {
    name: 'Iglas Rainwater Harvesting Basin',
    district: 'Aligarh',
    state: 'Uttar Pradesh',
    lat: 27.7100,
    lng: 77.9400,
    before_ndvi: 0.28,
    after_ndvi: 0.67,
    gain_pct: '+139%',
    area_restored: '580 Hectares',
    biomass_gain: '+3,890 Metric Tons',
    soil_moisture: '+41%',
    desc: 'Extensive farm pond network enabled mustard and wheat vegetative expansion across sandy loam tracts.'
  },
  'WD-402': {
    name: 'Babina Bundelkhand Recharge Network',
    district: 'Jhansi',
    state: 'Uttar Pradesh',
    lat: 25.4484,
    lng: 78.5685,
    before_ndvi: 0.18,
    after_ndvi: 0.61,
    gain_pct: '+238%',
    area_restored: '850 Hectares',
    biomass_gain: '+5,150 Metric Tons',
    soil_moisture: '+48%',
    desc: 'Granite aquifer recharge shafts and mason check dams revived dry borewells in rocky Bundelkhand.'
  },
  'WD-505': {
    name: 'Karwi Sub-Catchment Rejuvenation',
    district: 'Chitrakoot',
    state: 'Uttar Pradesh',
    lat: 25.2100,
    lng: 80.9100,
    before_ndvi: 0.24,
    after_ndvi: 0.54,
    gain_pct: '+125%',
    area_restored: '620 Hectares',
    biomass_gain: '+3,240 Metric Tons',
    soil_moisture: '+29%',
    desc: 'Gully plugs along Vindhyan hillslopes trapped silt and accelerated native shrub & agro-forestry cover.'
  },
  'WD-612': {
    name: 'Robertsganj Plateau Drainage Basin',
    district: 'Sonbhadra',
    state: 'Uttar Pradesh',
    lat: 24.6850,
    lng: 83.0650,
    before_ndvi: 0.19,
    after_ndvi: 0.44,
    gain_pct: '+131%',
    area_restored: '490 Hectares',
    biomass_gain: '+2,080 Metric Tons',
    soil_moisture: '+26%',
    desc: 'Contour stone bunds prevented severe sheet erosion on red gravel plateau soils.'
  },
  'WD-701': {
    name: 'Bundelkhand Ken-Betwa Catchment',
    district: 'Banda',
    state: 'Uttar Pradesh',
    lat: 25.4750,
    lng: 80.3350,
    before_ndvi: 0.22,
    after_ndvi: 0.56,
    gain_pct: '+155%',
    area_restored: '740 Hectares',
    biomass_gain: '+4,420 Metric Tons',
    soil_moisture: '+38%',
    desc: 'Tributary detention ponds and stream desiltation regenerated river bank green buffer zones.'
  }
};

const SPECTRAL_LAYERS = {
  'truecolor': {
    before: 'assets/ndvi_before.jpg',
    after: 'assets/ndvi_after.jpg',
    labelBefore: 'BASELINE (JUNE 2023) • ARID TERRAIN',
    labelAfter: 'REJUVENATED (OCT 2025) • POST-PROJECT'
  },
  'heatmap': {
    before: 'assets/ndvi_heat_before.jpg',
    after: 'assets/ndvi_heat_after.jpg',
    labelBefore: 'NDVI HEATMAP (0.15 - 0.25) • LOW VEG',
    labelAfter: 'NDVI HEATMAP (0.55 - 0.75) • DENSE CANOPY'
  },
  'cir': {
    before: 'assets/ndvi_cir_before.jpg',
    after: 'assets/ndvi_cir_after.jpg',
    labelBefore: 'CIR (B08-B04-B03) • SPARSE REFLECTANCE',
    labelAfter: 'CIR (B08-B04-B03) • HIGH NIR VIGOR'
  }
};

class NDVISplitSlider {
  constructor(containerId, handleId, overlayId) {
    this.container = document.getElementById(containerId);
    this.handle = document.getElementById(handleId);
    this.overlay = document.getElementById(overlayId);
    this.dividerLine = document.getElementById('ndviDividerLine');
    this.rangeInput = document.getElementById('ndviRangeInput');
    this.probeHud = document.getElementById('ndviProbeHud');
    this.beforeImg = document.getElementById('ndviBeforeImg');
    this.afterImg = document.getElementById('ndviAfterImg');

    this.position = 50;
    this.isDragging = false;
    this.animInterval = null;
    this.viewMode = 'truecolor';
    this.currentProject = 'WD-204';

    if (this.container) {
      this.initEvents();
      this.setPosition(50);
      this.updateProjectDetails('WD-204');
    }
  }

  initEvents() {
    const startDrag = (e) => {
      this.isDragging = true;
      this.stopAnimation();
      let clientX = e.clientX;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      }
      if (clientX !== undefined) {
        this.updateFromClientX(clientX);
      }
    };

    const stopDrag = () => {
      this.isDragging = false;
    };

    const onMove = (e) => {
      let clientX = e.clientX;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      }
      if (this.isDragging && clientX !== undefined) {
        this.updateFromClientX(clientX);
      }
      if (e.type === 'mousemove') {
        this.updateProbeHUD(e);
      }
    };

    // Listen on container as well as handle for intuitive dragging anywhere
    if (this.container) {
      this.container.addEventListener('mousedown', startDrag);
      this.container.addEventListener('touchstart', startDrag, { passive: false });
      this.container.addEventListener('mousemove', (e) => this.updateProbeHUD(e));
    }

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchmove', onMove, { passive: false });

    if (this.rangeInput) {
      this.rangeInput.addEventListener('input', (e) => {
        this.stopAnimation();
        this.setPosition(parseFloat(e.target.value));
      });
    }
  }

  updateFromClientX(clientX) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width <= 0) return;

    let pos = clientX - rect.left;
    if (pos < 0) pos = 0;
    if (pos > rect.width) pos = rect.width;

    const percentage = (pos / rect.width) * 100;
    this.setPosition(percentage);
  }

  setPosition(percentage) {
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    this.position = percentage;

    // Use clip-path on the overlay so inner image is NEVER squished or scaled!
    if (this.overlay) {
      this.overlay.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
      this.overlay.style.webkitClipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
    }

    if (this.handle) {
      this.handle.style.left = `${percentage}%`;
    }

    if (this.dividerLine) {
      this.dividerLine.style.left = `${percentage}%`;
    }

    if (this.rangeInput && Math.abs(parseFloat(this.rangeInput.value) - percentage) > 0.5) {
      this.rangeInput.value = Math.round(percentage);
    }
  }

  startAnimation() {
    this.stopAnimation();
    let direction = 1;
    let currentPct = this.position || 50;

    const btn = document.getElementById('btnNdviAnimate');
    if (btn) {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause Scan`;
      btn.classList.add('btn-primary');
    }

    this.animInterval = setInterval(() => {
      currentPct += direction * 0.9;
      if (currentPct >= 90) direction = -1;
      if (currentPct <= 10) direction = 1;
      this.setPosition(currentPct);
    }, 20);
  }

  stopAnimation() {
    if (this.animInterval) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }
    const btn = document.getElementById('btnNdviAnimate');
    if (btn) {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Auto-Animate Scan`;
      btn.classList.remove('btn-primary');
    }
  }

  toggleAnimation() {
    if (this.animInterval) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  setViewMode(mode) {
    if (!SPECTRAL_LAYERS[mode]) return;
    this.viewMode = mode;
    const layer = SPECTRAL_LAYERS[mode];

    if (this.beforeImg) this.beforeImg.src = layer.before;
    if (this.afterImg) this.afterImg.src = layer.after;

    const tagBefore = document.getElementById('ndviTagBefore');
    const tagAfter = document.getElementById('ndviTagAfter');
    if (tagBefore) tagBefore.textContent = layer.labelBefore;
    if (tagAfter) tagAfter.textContent = layer.labelAfter;

    // Update active pill button
    const pills = document.querySelectorAll('.ndvi-mode-pill');
    pills.forEach((p) => {
      if (p.getAttribute('data-mode') === mode) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    if (typeof showToast === 'function') {
      showToast(`Switched view to ${mode.toUpperCase()} multispectral band`, 'info');
    }
  }

  updateProbeHUD(e) {
    if (!this.container || !this.probeHud) return;
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    const xPct = (x / rect.width) * 100;
    const proj = NDVI_PROJECT_DATA[this.currentProject] || NDVI_PROJECT_DATA['WD-204'];

    const simLat = (proj.lat + (0.5 - y / rect.height) * 0.04).toFixed(4);
    const simLng = (proj.lng + (x / rect.width - 0.5) * 0.04).toFixed(4);

    let ndviVal, classification, nir, red;

    // Left side is Before (Arid), Right side is After (Lush)
    if (xPct < this.position) {
      // Arid pre-project zone
      ndviVal = (proj.before_ndvi + (Math.sin(x * 0.05) * 0.03)).toFixed(2);
      nir = 0.22;
      red = 0.17;
      classification = 'Sparse Scrub / Degraded Topsoil';
    } else {
      // Rejuvenated post-project zone
      ndviVal = (proj.after_ndvi + (Math.sin(x * 0.08) * 0.05)).toFixed(2);
      nir = 0.59;
      red = 0.12;
      classification = 'Dense Vegetative Canopy / Moist Biomass';
    }

    this.probeHud.innerHTML = `
      <span>📍 <b>${simLat}°N, ${simLng}°E</b></span>
      <span>|</span>
      <span>🛰️ B08 (NIR): <b>${nir}</b> · B04 (Red): <b>${red}</b></span>
      <span>|</span>
      <span>🌱 Local NDVI: <b style="color: ${ndviVal > 0.4 ? '#10b981' : '#f59e0b'};">${ndviVal > 0 ? '+' : ''}${ndviVal}</b> (${classification})</span> | <span style="color:#94a3b8;font-size:10px;">[Prototype Dataset]</span>
    `;
  }

  updateProjectDetails(projectId) {
    const proj = NDVI_PROJECT_DATA[projectId] || NDVI_PROJECT_DATA['WD-204'];
    this.currentProject = projectId;

    const sel = document.getElementById('ndviProjectSelect');
    if (sel && sel.value !== projectId) {
      sel.value = projectId;
    }

    const sub = document.getElementById('ndviProjectSubTitle');
    if (sub) {
      sub.textContent = `${proj.name} (${projectId}) • ${proj.district}, ${proj.state} — ${proj.desc} [Prototype Dataset]`;
    }

    const elPre = document.getElementById('ndviPreValue');
    const elPost = document.getElementById('ndviPostValue');
    const elGain = document.getElementById('ndviGainValue');
    const elArea = document.getElementById('ndviAreaValue');

    if (elPre) elPre.textContent = proj.before_ndvi.toFixed(2);
    if (elPost) elPost.textContent = proj.after_ndvi.toFixed(2);
    if (elGain) elGain.textContent = proj.gain_pct;
    if (elArea) elArea.textContent = proj.area_restored;
  }
}

// Global helpers and exposure
window.NDVISplitSlider = NDVISplitSlider;
window.ndviSlider = null;

window.initNdviSlider = function() {
  if (document.getElementById('ndviContainer')) {
    window.ndviSlider = new NDVISplitSlider('ndviContainer', 'ndviHandle', 'ndviOverlay');
  }
};

window.setNdviSplit = function(percentage) {
  if (window.ndviSlider) {
    window.ndviSlider.stopAnimation();
    window.ndviSlider.setPosition(percentage);
  }
};

window.startNdviAnimation = function() {
  if (window.ndviSlider) window.ndviSlider.startAnimation();
};

window.stopNdviAnimation = function() {
  if (window.ndviSlider) window.ndviSlider.stopAnimation();
};

window.toggleNdviAnimation = function() {
  if (window.ndviSlider) window.ndviSlider.toggleAnimation();
};

window.setNdviViewMode = function(mode) {
  if (window.ndviSlider) window.ndviSlider.setViewMode(mode);
};

window.onNdviProjectChange = function(projectId) {
  if (window.ndviSlider) window.ndviSlider.updateProjectDetails(projectId);
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initNdviSlider);
} else {
  window.initNdviSlider();
}
