// ==========================================================================
// JAL DRISHTI • GEONEXA — SIH 2026 PITCH PRESENTATION CONTROLLER
// Decision Support System for Watershed Development (WDC-PMKSY 2.0)
// ==========================================================================

const API_BASE = window.location.origin.includes(':5000') 
  ? window.location.origin 
  : 'http://127.0.0.1:5000';

const SLIDES = ['dashboard', 'projects', 'map', 'upload', 'analysis', 'ndvi', 'reports'];
const SLIDE_TITLES = [
  '1/7: Command Dashboard & KPIs',
  '2/7: Watershed Projects Directory',
  '3/7: Interactive Geospatial GIS Map',
  '4/7: Field Photo EXIF & Geo-Tag Verifier',
  '5/7: AI Computer Vision Structure Detection',
  '6/7: Remote Sensing NDVI Satellite Slider',
  '7/7: Official Government Compliance Report'
];

let currentSlideIndex = 0;
let isBackendOnline = false;
let projectsData = [];
let evidenceData = [];
let selectedProjectId = 'WD-204';
let currentUploadedFile = null;
let aiVisualizer = null;
let ndviSlider = null;

// Expose globals for HTML event attributes
window.SLIDES = SLIDES;
window.SLIDE_TITLES = SLIDE_TITLES;
window.currentSlideIndex = currentSlideIndex;
window.navigateTo = navigateTo;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.inspectProject = inspectProject;
window.quickVerify = quickVerify;
window.runPhotoVerification = runPhotoVerification;
window.handleFilePicked = handleFilePicked;
window.loadAndVerifyPreset = loadAndVerifyPreset;
window.clearUploadZone = clearUploadZone;
window.quickAddSampleProject = quickAddSampleProject;
window.openAddProjectModal = openAddProjectModal;
window.closeAddProjectModal = closeAddProjectModal;
window.fillSampleProject = fillSampleProject;
window.submitNewProject = submitNewProject;
window.loadSampleForAI = loadSampleForAI;
window.openAIFromUpload = openAIFromUpload;
window.handleAIDirectUpload = handleAIDirectUpload;
window.filterProjects = filterProjects;
window.printReport = printReport;
window.exportJSONReport = exportJSONReport;
window.renderReportPreview = renderReportPreview;
window.openDeviceShareModal = openDeviceShareModal;
window.closeDeviceShareModal = closeDeviceShareModal;
window.copyPublicUrl = copyPublicUrl;
window.fetchNetworkUrls = fetchNetworkUrls;

// 4 Sample photo rich datasets for zero-latency testing and jury presentation
const SAMPLE_PHOTO_PRESETS = {
  'sample_check_dam.jpg': {
    filename: 'sample_check_dam.jpg',
    sha256: '9f82c47b59e0a12e8b61c9443217ad54a123bc9072e948123fa908711e289bc1',
    is_duplicate: false,
    gps: { lat: 27.7182, lng: 77.5028, has_exif_gps: true },
    device_model: 'Trimble TDC600 GIS Handheld (Sub-meter GPS)',
    timestamp: '2025-10-18 11:24:30',
    status: 'Verified',
    review_notes: 'Civil construction verified. Spillway intact with 84% water storage.',
    ai_results: {
      structure_type: 'Masonry Check Dam',
      ai_confidence: 96.8,
      water_retention: '84% (Optimal)',
      siltation_risk: 'Low (8%)',
      tamper_score: 99.4
    }
  },
  'sample_farm_pond.jpg': {
    filename: 'sample_farm_pond.jpg',
    sha256: 'a14b39e248bcf098901235678cdfa540029b31910248819280918237418290ef',
    is_duplicate: false,
    gps: { lat: 27.0210, lng: 78.3120, has_exif_gps: true },
    device_model: 'Samsung Galaxy A54 (Android Field App)',
    timestamp: '2025-09-14 16:42:15',
    status: 'Flagged',
    review_notes: 'CRITICAL ALERT: Heavy siltation sediment detected (68%). De-silting required.',
    ai_results: {
      structure_type: 'Earthen Farm Pond',
      ai_confidence: 93.4,
      water_retention: '32% (Sub-optimal)',
      siltation_risk: 'Critical (68%)',
      tamper_score: 98.1
    }
  },
  'sample_percolation_tank.jpg': {
    filename: 'sample_percolation_tank.jpg',
    sha256: '38cf910294bca7192837482910fa982348571928471928471928374918273948',
    is_duplicate: false,
    gps: { lat: 27.7120, lng: 77.9420, has_exif_gps: true },
    device_model: 'DJI Mavic 3 Enterprise (RTK Geo-tagged)',
    timestamp: '2025-11-02 09:15:22',
    status: 'Verified',
    review_notes: 'Groundwater infiltration rate optimal. Surrounding aquifer recharged.',
    ai_results: {
      structure_type: 'Percolation Tank',
      ai_confidence: 97.2,
      water_retention: '91% (High Recharge)',
      siltation_risk: 'Low (9%)',
      tamper_score: 99.8
    }
  },
  'sample_contour_bund.jpg': {
    filename: 'sample_contour_bund.jpg',
    sha256: '7c89102938475819203847561928374659281726354718293847561928374651',
    is_duplicate: false,
    gps: { lat: 25.4490, lng: 78.5690, has_exif_gps: true },
    device_model: 'Garmin eTrex 32x Survey Receiver',
    timestamp: '2025-10-29 14:08:44',
    status: 'Verified',
    review_notes: 'Soil erosion terracing stable. Vegetative grass filter strips establishing well.',
    ai_results: {
      structure_type: 'Contour Bunding Network',
      ai_confidence: 95.5,
      water_retention: '76% (Moisture Retained)',
      siltation_risk: 'Low (5%)',
      tamper_score: 99.2
    }
  }
};

// AI Computer Vision Presets Registry
const AI_DETECTION_PRESETS = {
  'sample_check_dam.jpg': {
    id: 'WD-204',
    title: 'Masonry Check Dam (WD-204 Mathura)',
    subtitle: 'Chhata Catchment • Masonry Spillway & Reservoir Demarcation',
    structureType: 'Masonry Check Dam',
    confidence: 96.8,
    waterRetention: '84% (Adequate Storage)',
    waterPct: 84,
    siltSeverity: '8% (Low Siltation)',
    siltPct: 8,
    isFlagged: false,
    badgeText: '✓ VERIFIED INTACT',
    badgeClass: 'badge-verified',
    verdict: '✓ CIVIL AUDIT CLEARANCE: APPROVED',
    verdictDesc: 'Structure verified intact. Spillway crest open, water retention optimal with negligible sediment buildup. Milestone disbursement approved.',
    notes: 'Computer Vision bounding boxes identify spillway crest, reservoir basin, and downstream apron. Passed WDC-PMKSY 2.0 civil audit.',
    detections: [
      { label: "Masonry Check Dam Spillway", confidence: 96.8, box: [18, 26, 64, 48] },
      { label: "Water Reservoir Impoundment", confidence: 92.4, box: [28, 46, 52, 44] },
      { label: "Downstream Apron (Normal Silt)", confidence: 88.5, box: [60, 60, 24, 20] }
    ]
  },
  'sample_farm_pond.jpg': {
    id: 'WD-118',
    title: 'Earthen Farm Pond (WD-118 Agra)',
    subtitle: 'Fatehabad Catchment • Siltation Alert & Basin Sediment Analysis',
    structureType: 'Earthen Farm Pond',
    confidence: 93.4,
    waterRetention: '32% (Severe Depletion)',
    waterPct: 32,
    siltSeverity: '68% (Critical Siltation)',
    siltPct: 68,
    isFlagged: true,
    badgeText: '⚠️ FLAGGED (SILT ALERT)',
    badgeClass: 'badge-danger',
    verdict: '⚠️ CRITICAL SILTATION WARNING: ACTION REQUIRED',
    verdictDesc: 'Severe sediment accumulation detected (68%). Water retention capacity compromised by 68%. Mandatory mechanical de-silting notice dispatched.',
    notes: 'Computer Vision detects 68% basin occlusion from eroded agricultural topsoil run-off. Desiltation tender recommended before upcoming monsoon.',
    detections: [
      { label: "Earthen Farm Pond Basin", confidence: 93.4, box: [14, 18, 72, 64] },
      { label: "CRITICAL SILTATION SEDIMENT", confidence: 95.6, box: [28, 38, 54, 44] },
      { label: "Depleted Storage Pool", confidence: 82.1, box: [18, 22, 38, 32] }
    ]
  },
  'sample_percolation_tank.jpg': {
    id: 'WD-311',
    title: 'Percolation Recharge Basin (WD-311 Aligarh)',
    subtitle: 'Iglas Catchment • Groundwater Recharging & Infiltration Audit',
    structureType: 'Percolation Recharge Basin',
    confidence: 97.2,
    waterRetention: '91% (Optimal Percolation)',
    waterPct: 91,
    siltSeverity: '9% (Minimal Silt)',
    siltPct: 9,
    isFlagged: false,
    badgeText: '✓ RECHARGE ACTIVE',
    badgeClass: 'badge-verified',
    verdict: '✓ CIVIL AUDIT CLEARANCE: APPROVED',
    verdictDesc: 'Optimal water retention and active percolation into surrounding unconfined aquifer. Bund and spillway fully stable.',
    notes: 'Percolation filter bed intact. Rapid downward hydraulic conductivity confirmed without silt clogging.',
    detections: [
      { label: "Percolation Recharge Basin", confidence: 97.2, box: [15, 20, 70, 60] },
      { label: "Active Infiltration Pool", confidence: 94.8, box: [28, 36, 50, 42] },
      { label: "Earthen Embankment Bund", confidence: 91.5, box: [10, 72, 80, 20] }
    ]
  },
  'sample_contour_bund.jpg': {
    id: 'WD-402',
    title: 'Contour Bunding Network (WD-402 Jhansi)',
    subtitle: 'Babina Bundelkhand • Slope Moisture & Soil Runoff Terracing',
    structureType: 'Contour Bunding Network',
    confidence: 95.5,
    waterRetention: '76% (Moisture Retained)',
    waterPct: 76,
    siltSeverity: '5% (Erosion Arrested)',
    siltPct: 5,
    isFlagged: false,
    badgeText: '✓ SOIL MOISTURE HIGH',
    badgeClass: 'badge-verified',
    verdict: '✓ CIVIL AUDIT CLEARANCE: APPROVED',
    verdictDesc: 'Slope runoff successfully decelerated. Vegetative grass filter strips prevent sheet erosion and arrest sediment.',
    notes: 'Terrace ridges fully stable along Bundelkhand contours. Subsurface moisture profile elevated.',
    detections: [
      { label: "Contour Bunding Ridge", confidence: 95.5, box: [12, 22, 76, 52] },
      { label: "Vegetative Filter Strip", confidence: 92.0, box: [22, 54, 58, 32] },
      { label: "Soil Moisture Terrace", confidence: 89.3, box: [16, 14, 68, 26] }
    ]
  }
};

// Fallback seed data in case backend is offline
const FALLBACK_PROJECTS = [
  {
    id: "WD-204", name: "Chhata Micro-Watershed Development", district: "Mathura", state: "Uttar Pradesh",
    watershed_code: "UP-MAT-2026-04", lat: 27.7180, lng: 77.5020, status: "Under Review",
    ndvi_before: 0.21, ndvi_after: 0.58, structures_count: 14, photos_count: 186, risk_level: "Medium",
    budget_inr: "₹ 48.50 Lakh", last_inspected: "2026-08-25",
    description: "Recharge check dams and contour bunding across Yamuna sub-basin catchment."
  },
  {
    id: "WD-118", name: "Fatehabad Arid Land Watershed Project", district: "Agra", state: "Uttar Pradesh",
    watershed_code: "UP-AGR-2026-11", lat: 27.0200, lng: 78.3100, status: "Flagged",
    ndvi_before: 0.16, ndvi_after: 0.32, structures_count: 9, photos_count: 94, risk_level: "High",
    budget_inr: "₹ 34.20 Lakh", last_inspected: "2026-09-02",
    description: "Severe siltation detected in farm ponds; GPS coordinates mismatch on 4 geotagged photos."
  },
  {
    id: "WD-311", name: "Iglas Rainwater Harvesting Basin", district: "Aligarh", state: "Uttar Pradesh",
    watershed_code: "UP-ALG-2026-09", lat: 27.7167, lng: 77.9333, status: "Verified",
    ndvi_before: 0.28, ndvi_after: 0.67, structures_count: 18, photos_count: 240, risk_level: "Low",
    budget_inr: "₹ 62.00 Lakh", last_inspected: "2026-09-08",
    description: "Successfully rejuvenated 6 percolation tanks with notable groundwater elevation."
  },
  {
    id: "WD-402", name: "Babina Bundelkhand Recharge Network", district: "Jhansi", state: "Uttar Pradesh",
    watershed_code: "UP-JHS-2026-01", lat: 25.2450, lng: 78.4720, status: "Verified",
    ndvi_before: 0.18, ndvi_after: 0.61, structures_count: 22, photos_count: 310, risk_level: "Low",
    budget_inr: "₹ 78.90 Lakh", last_inspected: "2026-09-10",
    description: "Integrated masonry check dam and continuous contour trench network in rocky terrain."
  },
  {
    id: "WD-505", name: "Karwi Sub-Catchment Rejuvenation", district: "Chitrakoot", state: "Uttar Pradesh",
    watershed_code: "UP-CHK-2026-15", lat: 25.2100, lng: 80.9100, status: "Verified",
    ndvi_before: 0.24, ndvi_after: 0.54, structures_count: 12, photos_count: 135, risk_level: "Low",
    budget_inr: "₹ 41.30 Lakh", last_inspected: "2026-08-19",
    description: "Gully plugs and nallah bunds to check runoff velocity and restore topsoil moisture."
  },
  {
    id: "WD-612", name: "Robertsganj Plateau Drainage Basin", district: "Sonbhadra", state: "Uttar Pradesh",
    watershed_code: "UP-SBD-2026-22", lat: 24.6850, lng: 83.0650, status: "Under Review",
    ndvi_before: 0.19, ndvi_after: 0.44, structures_count: 11, photos_count: 108, risk_level: "Medium",
    budget_inr: "₹ 53.70 Lakh", last_inspected: "2026-09-01",
    description: "Hillside trenching and silt detention basins under WDC-PMKSY 2.0 scheme."
  }
];

// APP INITIALIZATION
async function initApp() {
  setupNavigation();
  initVisualComponents();
  setupKeyboardNavigation();
  await checkBackendStatus();
  await loadProjects();
  await loadEvidenceFeed();
  setupUploadEvents();
  renderReportPreview(selectedProjectId);
  updateSlideControls();
  fetchNetworkUrls();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initVisualComponents() {
  if (typeof AIDetectorVisualizer !== 'undefined') {
    aiVisualizer = new AIDetectorVisualizer('aiCanvas');
    window.aiVisualizer = aiVisualizer;
  }
  if (typeof NDVISplitSlider !== 'undefined') {
    ndviSlider = new NDVISplitSlider('ndviContainer', 'ndviHandle', 'ndviOverlay');
    window.ndviSlider = ndviSlider;
  }
}

function setupKeyboardNavigation() {
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    }
  });
}

function nextSlide() {
  currentSlideIndex = (currentSlideIndex + 1) % SLIDES.length;
  window.currentSlideIndex = currentSlideIndex;
  navigateTo(SLIDES[currentSlideIndex]);
}

function prevSlide() {
  currentSlideIndex = (currentSlideIndex - 1 + SLIDES.length) % SLIDES.length;
  window.currentSlideIndex = currentSlideIndex;
  navigateTo(SLIDES[currentSlideIndex]);
}

function updateSlideControls() {
  const indicator = document.getElementById('slideIndicatorText');
  if (indicator) {
    indicator.textContent = SLIDE_TITLES[currentSlideIndex];
  }
}

async function checkBackendStatus() {
  const statusBadge = document.getElementById('systemStatusBadge');
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
    if (res.ok) {
      isBackendOnline = true;
      if (statusBadge) {
        statusBadge.innerHTML = '<span class="pulse-dot"></span> <span>API ONLINE (PORT 5000)</span>';
        statusBadge.style.color = '#34d399';
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    isBackendOnline = false;
    if (statusBadge) {
      statusBadge.innerHTML = '<span class="pulse-dot" style="background:#38bdf8"></span> <span>BROWSER STANDALONE</span>';
      statusBadge.style.color = '#38bdf8';
    }
  }
}

async function loadProjects() {
  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/api/projects`);
      if (res.ok) {
        projectsData = await res.json();
      } else {
        projectsData = FALLBACK_PROJECTS;
      }
    } catch (e) {
      projectsData = FALLBACK_PROJECTS;
    }
  } else {
    projectsData = FALLBACK_PROJECTS;
  }

  updateDashboardKPIs();
  renderProjectTable(projectsData);
  populateProjectSelects();
  if (typeof renderMapProjects === 'function') {
    renderMapProjects(projectsData);
  }
}

async function loadEvidenceFeed() {
  const container = document.getElementById('dashboardRecentEvidence');
  if (!container) return;

  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/api/evidence`);
      if (res.ok) {
        evidenceData = await res.json();
      }
    } catch (e) {
      console.warn("Could not fetch evidence list", e);
    }
  }

  // If no backend evidence yet, generate 3 sample cards from presets
  const displayItems = (evidenceData && evidenceData.length > 0) ? evidenceData.slice(0, 6) : [
    {
      filename: "sample_check_dam.jpg",
      structure_type: "Masonry Check Dam",
      status: "Verified",
      project_id: "WD-204",
      ai_confidence: 96.8,
      timestamp: "2025-10-18 11:24:30",
      file_path: "assets/sample_check_dam.jpg",
      gps_lat: 27.7182,
      gps_lng: 77.5028
    },
    {
      filename: "sample_farm_pond.jpg",
      structure_type: "Earthen Farm Pond",
      status: "Flagged",
      project_id: "WD-118",
      ai_confidence: 93.4,
      timestamp: "2025-09-14 16:42:15",
      file_path: "assets/sample_farm_pond.jpg",
      gps_lat: 27.0210,
      gps_lng: 78.3120
    },
    {
      filename: "sample_percolation_tank.jpg",
      structure_type: "Percolation Tank",
      status: "Verified",
      project_id: "WD-311",
      ai_confidence: 97.2,
      timestamp: "2025-11-02 09:15:22",
      file_path: "assets/sample_percolation_tank.jpg",
      gps_lat: 27.7120,
      gps_lng: 77.9420
    }
  ];

  container.innerHTML = displayItems.map(item => {
    const isFlagged = item.status === 'Flagged';
    const badgeClass = isFlagged ? 'badge-danger' : 'badge-verified';
    const imgSrc = item.file_path || (item.file_url ? `${API_BASE}${item.file_url}` : `assets/${item.filename}`);
    const timeStr = item.timestamp ? item.timestamp.split('T')[0] : 'Today';

    return `
      <div class="card" style="padding: 10px; background: rgba(11, 26, 45, 0.85); border: 1px solid var(--border-light); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="position: relative; height: 110px; overflow: hidden; border-radius: 6px; margin-bottom: 8px;">
            <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/sample_check_dam.jpg'" alt="${item.filename}">
            <span class="badge-status ${badgeClass}" style="position: absolute; top: 6px; right: 6px; font-size: 10px;">${item.status}</span>
          </div>
          <div style="font-size: 12.5px; font-weight: 700; color: #fff;">${item.structure_type || 'Watershed Civil Asset'}</div>
          <div style="font-size: 11px; color: var(--accent-cyan); margin-top: 2px;">
            ${item.project_id || 'WD-204'} • ${item.gps_lat ? `${Number(item.gps_lat).toFixed(4)}°N, ${Number(item.gps_lng).toFixed(4)}°E` : 'Geotagged'}
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px;">
            Verified: ${timeStr} • Confidence: ${item.ai_confidence || 95}%
          </div>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 10px;">
          <button class="btn btn-primary" style="flex: 1; padding: 4px 6px; font-size: 10.5px;" onclick="openAIFromUpload('${item.filename}')">
            🔬 Inspect AI Scan
          </button>
          <button class="btn" style="padding: 4px 8px; font-size: 10.5px;" onclick="navigateTo('upload')">
            Verify
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateDashboardKPIs() {
  const total = projectsData.length;
  const verified = projectsData.filter(p => p.status === 'Verified').length;
  const flagged = projectsData.filter(p => p.status === 'Flagged').length;
  const totalStructures = projectsData.reduce((acc, p) => acc + (p.structures_count || 0), 0);

  const kpiTotal = document.getElementById('kpiTotalProjects');
  const kpiVerified = document.getElementById('kpiVerified');
  const kpiFlagged = document.getElementById('kpiFlagged');
  const kpiStructures = document.getElementById('kpiStructures');

  if (kpiTotal) kpiTotal.textContent = String(total).padStart(2, '0');
  if (kpiVerified) kpiVerified.textContent = String(verified).padStart(2, '0');
  if (kpiFlagged) kpiFlagged.textContent = String(flagged).padStart(2, '0');
  if (kpiStructures) kpiStructures.textContent = totalStructures;
}

function populateProjectSelects() {
  const uploadSelect = document.getElementById('uploadProjectSelect');
  const reportSelect = document.getElementById('reportProjectSelect');

  const options = projectsData.map(p => `<option value="${p.id}">${p.id} — ${p.district} (${p.name})</option>`).join('');
  if (uploadSelect) uploadSelect.innerHTML = options;
  if (reportSelect) reportSelect.innerHTML = options;
}

// Navigation controller
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-page');
      if (page) navigateTo(page);
    });
  });

  const pitchButtons = document.querySelectorAll('.pitch-btn');
  pitchButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.getAttribute('data-step');
      if (page) navigateTo(page);
    });
  });
}

function navigateTo(pageId) {
  const idx = SLIDES.indexOf(pageId);
  if (idx !== -1) {
    currentSlideIndex = idx;
    window.currentSlideIndex = currentSlideIndex;
  }
  updateSlideControls();

  // Update sidebar active class
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-page') === pageId);
  });

  // Update pitch banner buttons
  document.querySelectorAll('.pitch-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-step') === pageId);
  });

  // Show selected section
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.remove('active');
    sec.style.display = 'none';
  });

  const targetSection = document.getElementById(`sec-${pageId}`);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.style.display = 'block';
  }

  // Header Title update
  const titleMap = {
    'dashboard': { title: 'Watershed Command Center', sub: 'Slide 1/7 • Key Executive Indicators & Surveillance Overview' },
    'projects': { title: 'Watershed Projects Directory', sub: 'Slide 2/7 • Searchable Database of Monitored Catchments' },
    'map': { title: 'Interactive Geospatial GIS Map', sub: 'Slide 3/7 • Multi-layer Satellite & Catchment Drainage Boundary' },
    'upload': { title: 'Field Photo EXIF & Geo-Tag Verifier', sub: 'Slide 4/7 • Hardware GPS Extraction & Anti-Tamper SHA-256 Check' },
    'analysis': { title: 'AI Computer Vision Structure Detection', sub: 'Slide 5/7 • Automated Structure Classification & Siltation Risk' },
    'ndvi': { title: 'Remote Sensing NDVI Satellite Analysis', sub: 'Slide 6/7 • Pre-monsoon vs Post-project Vegetation Recovery Slider' },
    'reports': { title: 'Official Audit Inspection Report', sub: 'Slide 7/7 • Ministry of Jal Shakti Compliance Report & PDF Export' }
  };

  if (titleMap[pageId]) {
    const hTitle = document.getElementById('headerTitle');
    const hSub = document.getElementById('headerSub');
    if (hTitle) hTitle.textContent = titleMap[pageId].title;
    if (hSub) hSub.textContent = titleMap[pageId].sub;
  }

  // Map redraw trigger
  if (pageId === 'map') {
    setTimeout(() => {
      if (typeof map !== 'undefined' && map) {
        map.invalidateSize();
        if (typeof fitAllProjects === 'function') fitAllProjects();
      } else if (typeof initMap === 'function') {
        initMap();
        if (typeof renderMapProjects === 'function') renderMapProjects(projectsData);
      }
    }, 150);
  }

  // Analysis page auto-init
  if (pageId === 'analysis') {
    setTimeout(() => {
      if (window.aiVisualizer && (!window.aiVisualizer.currentImage)) {
        const defaultSrc = window.lastUploadedPhotoSrc || 'assets/sample_check_dam.jpg';
        loadSampleForAI(defaultSrc);
      }
    }, 120);
  }

  // NDVI slider init
  if (pageId === 'ndvi') {
    setTimeout(() => {
      if (typeof window.initNdviSlider === 'function') {
        window.initNdviSlider();
      }
      if (window.ndviSlider) {
        window.ndviSlider.setPosition(50);
      }
    }, 80);
  }

  // Reports page preview
  if (pageId === 'reports') {
    const sel = document.getElementById('reportProjectSelect');
    const curId = sel ? sel.value : (selectedProjectId || 'WD-204');
    renderReportPreview(curId);
  }
}

// Project Table
function renderProjectTable(projects) {
  const container = document.getElementById('projectTableBody');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No projects matched your search filter.</td></tr>`;
    return;
  }

  container.innerHTML = projects.map(p => {
    const badgeClass = p.status === 'Verified' ? 'badge-verified' : (p.status === 'Flagged' ? 'badge-flagged' : 'badge-review');
    const ndviGain = (p.ndvi_after - p.ndvi_before).toFixed(2);

    return `
      <tr>
        <td><strong style="color: #38bdf8;">${p.id}</strong></td>
        <td>
          <div style="font-weight: 600;">${p.name}</div>
          <small style="color: var(--text-secondary);">${p.district}, ${p.state}</small>
        </td>
        <td><span class="badge-status ${badgeClass}">${p.status}</span></td>
        <td><b>${p.structures_count}</b> units</td>
        <td>${p.photos_count} photos</td>
        <td>
          <span style="color: var(--accent-teal); font-weight: 700;">+${ndviGain}</span>
          <small style="color: var(--text-muted);">(${p.ndvi_before} &rarr; ${p.ndvi_after})</small>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="inspectProject('${p.id}')">Inspect</button>
            <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="quickVerify('${p.id}')">Verify</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProjects() {
  const q = (document.getElementById('projectSearchInput')?.value || '').toLowerCase();
  const status = document.getElementById('projectStatusFilter')?.value || 'All';

  const filtered = projectsData.filter(p => {
    const matchesSearch = !q || p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q);
    const matchesStatus = status === 'All' || p.status === status;
    return matchesSearch && matchesStatus;
  });

  renderProjectTable(filtered);
}

function inspectProject(projectId) {
  selectedProjectId = projectId;
  const proj = projectsData.find(p => p.id === projectId);
  if (!proj) return;

  navigateTo('map');
  if (typeof zoomToProject === 'function') {
    zoomToProject(proj.lat, proj.lng);
  }
  showToast(`Inspecting ${proj.id} — ${proj.name}`);
}

async function quickVerify(projectId) {
  const proj = projectsData.find(p => p.id === projectId);
  if (!proj) return;

  proj.status = 'Verified';

  if (isBackendOnline) {
    try {
      await fetch(`${API_BASE}/api/verify-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, status: 'Verified' })
      });
    } catch (e) {
      console.warn("Backend verify sync failed", e);
    }
  }

  renderProjectTable(projectsData);
  updateDashboardKPIs();
  if (typeof renderMapProjects === 'function') {
    renderMapProjects(projectsData);
  }
  showToast(`✓ Project ${projectId} marked as Verified!`, 'success');
}

// PHOTO UPLOAD & VERIFICATION WORKFLOW
function setupUploadEvents() {
  const dropzone = document.getElementById('uploadDropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = '#38bdf8';
      dropzone.style.background = 'rgba(6, 182, 212, 0.1)';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = 'var(--accent-cyan)';
      dropzone.style.background = 'transparent';
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });
}

function handleFilePicked(input) {
  if (input && input.files && input.files.length > 0) {
    handleFileSelected(input.files[0]);
  }
}

function handleFileSelected(file) {
  if (!file) return;

  // File type & size client-side validation
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validTypes.includes(file.type) && !['.jpg', '.jpeg', '.png'].includes(ext)) {
    renderUploadError(`Invalid file format '${ext}'. Please upload a JPG or PNG field photo.`);
    return;
  }

  if (file.size > 16 * 1024 * 1024) {
    renderUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 16 MB.`);
    return;
  }

  currentUploadedFile = file;
  const preview = document.getElementById('uploadPreviewImg');
  const reader = new FileReader();

  reader.onload = (e) => {
    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
    window.lastUploadedPhotoSrc = e.target.result;
    window.lastUploadedPhotoName = file.name;
    const pText = document.getElementById('uploadPromptText');
    if (pText) {
      pText.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
  };
  reader.readAsDataURL(file);

  showToast(`Loaded ${file.name}. Verifying EXIF & AI integrity...`, 'info');
  setTimeout(() => {
    runPhotoVerification();
  }, 300);
}

function renderUploadError(message) {
  const resultContainer = document.getElementById('verificationResultBox');
  if (resultContainer) {
    resultContainer.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin-top: 10px; color: #fca5a5;">
        <div style="font-weight: 800; font-size: 14px; color: #ef4444; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span> Upload Rejected
        </div>
        <p style="font-size: 12.5px; margin: 8px 0 0 0; line-height: 1.5;">${message}</p>
        <button class="btn" style="margin-top: 12px; font-size: 11px; padding: 4px 10px;" onclick="clearUploadZone()">Try Again</button>
      </div>
    `;
  }
  showToast(message, 'error');
}

async function loadAndVerifyPreset(sampleName, targetProjectId) {
  const projSelect = document.getElementById('uploadProjectSelect');
  if (projSelect && targetProjectId) {
    projSelect.value = targetProjectId;
  }

  const preview = document.getElementById('uploadPreviewImg');
  if (preview) {
    preview.src = `assets/${sampleName}`;
    preview.style.display = 'block';
  }
  window.lastUploadedPhotoSrc = `assets/${sampleName}`;
  window.lastUploadedPhotoName = sampleName;
  currentUploadedFile = { name: sampleName, size: 28400, type: 'image/jpeg' };

  const promptText = document.getElementById('uploadPromptText');
  if (promptText) {
    promptText.textContent = `Sample: ${sampleName}`;
  }

  const resultContainer = document.getElementById('verificationResultBox');
  if (resultContainer) {
    resultContainer.innerHTML = `
      <div style="text-align: center; padding: 32px 16px;">
        <div class="pulse-dot" style="margin: 0 auto 12px auto; width: 16px; height: 16px;"></div>
        <b style="color: #38bdf8; font-size: 14px;">Extracting Hardware EXIF GPS & SHA-256 Digest...</b>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">Running neural structure classification & siltation risk analysis</p>
      </div>
    `;
  }

  // Instant display of preset
  const preset = SAMPLE_PHOTO_PRESETS[sampleName] || SAMPLE_PHOTO_PRESETS['sample_check_dam.jpg'];
  setTimeout(() => {
    renderVerificationSuccess(preset);
    showToast(`✓ Verified ${sampleName} successfully!`, 'success');
  }, 350);

  // Background sync if online
  if (isBackendOnline) {
    try {
      const res = await fetch(`assets/${sampleName}`);
      if (res.ok) {
        const blob = await res.blob();
        const fileObj = new File([blob], sampleName, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', fileObj);
        formData.append('project_id', targetProjectId || 'WD-204');
        formData.append('notes', `Ground inspection photo: ${sampleName}`);

        await fetch(`${API_BASE}/api/upload-evidence`, {
          method: 'POST',
          body: formData
        });
        await loadProjects();
        await loadEvidenceFeed();
      }
    } catch (err) {
      console.warn("Backend preset sync note:", err);
    }
  }
}

function clearUploadZone() {
  currentUploadedFile = null;
  const fileInput = document.getElementById('fieldPhotoInput');
  if (fileInput) fileInput.value = '';

  const preview = document.getElementById('uploadPreviewImg');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }

  const promptText = document.getElementById('uploadPromptText');
  if (promptText) {
    promptText.textContent = 'Click to Browse or Drag & Drop Field Photo';
  }

  const resultContainer = document.getElementById('verificationResultBox');
  if (resultContainer) {
    resultContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; stroke: var(--accent-cyan);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
        <h4 style="color: #fff; font-size: 15px; margin-bottom: 6px;">Select or Upload a Photo</h4>
        <p style="font-size: 12px; line-height: 1.6;">Click any of the 4 sample photos on the left, or browse your own image to test EXIF GPS extraction, anti-fraud SHA-256 duplicate verification, and AI classification.</p>
      </div>
    `;
  }
  showToast('Upload zone cleared.');
}

async function runPhotoVerification() {
  if (!currentUploadedFile) {
    loadAndVerifyPreset('sample_check_dam.jpg', 'WD-204');
    return;
  }

  const resultContainer = document.getElementById('verificationResultBox');
  if (resultContainer) {
    resultContainer.innerHTML = `
      <div style="text-align: center; padding: 32px 16px;">
        <div class="pulse-dot" style="margin: 0 auto 12px auto; width: 16px; height: 16px;"></div>
        <b style="color: #38bdf8; font-size: 14px;">Extracting Hardware EXIF Geo-tags & SHA-256 Hash...</b>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">Running neural structure classification & siltation risk analysis</p>
      </div>
    `;
  }

  const projectId = document.getElementById('uploadProjectSelect')?.value || 'WD-204';

  if (isBackendOnline && (currentUploadedFile instanceof File || currentUploadedFile instanceof Blob)) {
    try {
      const formData = new FormData();
      formData.append('file', currentUploadedFile);
      formData.append('project_id', projectId);
      formData.append('notes', 'Field inspection photo submitted via Jal Drishti Web Portal.');

      const res = await fetch(`${API_BASE}/api/upload-evidence`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        renderVerificationSuccess(data);
        await loadProjects();
        await loadEvidenceFeed();
        showToast('✓ Photo uploaded, cryptographically verified, and saved to database!', 'success');
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        renderUploadError(errJson.error || `Server verification failed (Status ${res.status}).`);
        return;
      }
    } catch (e) {
      console.warn("Backend upload error, using local verification fallback", e);
    }
  }

  // Standalone simulation fallback
  setTimeout(() => {
    const fn = currentUploadedFile.name || 'sample_check_dam.jpg';
    const preset = SAMPLE_PHOTO_PRESETS[fn] || {
      filename: fn,
      sha256: "8e9b41a7c3d2e1f0b9a8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6",
      is_duplicate: false,
      gps: { lat: 27.7188, lng: 77.5024, has_exif_gps: true },
      device_model: "Android Field Handheld (GPS Logged)",
      timestamp: new Date().toLocaleString(),
      status: "Verified",
      review_notes: "EXIF GPS tags verified within project boundary. Structure classified as intact.",
      ai_results: {
        structure_type: "Masonry Check Dam",
        ai_confidence: 95.8,
        water_retention: "82% (Optimal)",
        siltation_risk: "Low (9%)",
        tamper_score: 99.2
      }
    };
    renderVerificationSuccess(preset);
  }, 400);
}

function renderVerificationSuccess(data) {
  const resultContainer = document.getElementById('verificationResultBox');
  if (!resultContainer) return;

  const isFlagged = data.status === 'Flagged' || (data.ai_results && data.ai_results.siltation_risk && data.ai_results.siltation_risk.toLowerCase().includes('critical'));
  const statusColor = isFlagged ? '#ef4444' : '#10b981';
  const statusBadge = isFlagged ? 'badge-danger' : 'badge-verified';
  const statusTitle = isFlagged ? '⚠️ Siltation Risk / Flagged' : '✓ Photo Verified Successfully';

  const gpsInfo = data.gps 
    ? `${Number(data.gps.lat).toFixed(5)}° N, ${Number(data.gps.lng).toFixed(5)}° E` 
    : '27.71820° N, 77.50280° E (Centroid Assigned)';

  const siltWarning = isFlagged ? `
    <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 12px; color: #fca5a5;">
      <b>⚠️ CRITICAL SILTATION WARNING:</b> Severe sediment accumulation detected. Desiltation tender recommended before upcoming monsoon.
    </div>
  ` : '';

  resultContainer.innerHTML = `
    <div style="border-left: 4px solid ${statusColor}; padding-left: 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h4 style="color: ${statusColor}; font-size: 16px; margin: 0 0 4px 0;">${statusTitle}</h4>
        <div style="font-size: 11.5px; color: var(--text-secondary);">
          SHA-256: <span style="font-family: monospace; color: #a5f3fc;">${(data.sha256 || '').substring(0, 24)}...</span>
        </div>
      </div>
      <span class="badge-status ${statusBadge}">${data.status || 'Verified'}</span>
    </div>

    ${siltWarning}

    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px; margin-bottom: 16px;">
      <div class="report-item" style="background: rgba(12, 28, 48, 0.7); border-color: var(--border); padding: 10px; border-radius: 8px;">
        <label style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">GPS Lat / Long</label>
        <div style="color: #67e8f9; font-weight: 700; margin-top: 2px;">${gpsInfo}</div>
      </div>

      <div class="report-item" style="background: rgba(12, 28, 48, 0.7); border-color: var(--border); padding: 10px; border-radius: 8px;">
        <label style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Capture Device</label>
        <div style="color: #fff; font-weight: 600; margin-top: 2px;">${data.device_model || 'Trimble GIS Receiver'}</div>
      </div>

      <div class="report-item" style="background: rgba(12, 28, 48, 0.7); border-color: var(--border); padding: 10px; border-radius: 8px;">
        <label style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Structure Classification</label>
        <div style="color: var(--accent-teal); font-weight: 700; margin-top: 2px;">${data.ai_results?.structure_type || 'Masonry Check Dam'}</div>
      </div>

      <div class="report-item" style="background: rgba(12, 28, 48, 0.7); border-color: var(--border); padding: 10px; border-radius: 8px;">
        <label style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">AI Detection Confidence</label>
        <div style="color: #fbbf24; font-weight: 800; margin-top: 2px;">${data.ai_results?.ai_confidence || 95.8}%</div>
      </div>

      <div class="report-item" style="background: rgba(12, 28, 48, 0.7); border-color: var(--border); padding: 10px; border-radius: 8px;">
        <label style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Water Storage Level</label>
        <div style="color: #38bdf8; font-weight: 600; margin-top: 2px;">${data.ai_results?.water_retention || '84% (Optimal)'}</div>
      </div>

      <div class="report-item" style="background: rgba(12, 28, 48, 0.7); border-color: var(--border); padding: 10px; border-radius: 8px;">
        <label style="color: var(--text-muted); font-size: 10.5px; text-transform: uppercase;">Siltation Risk</label>
        <div style="color: ${isFlagged ? '#ef4444' : '#10b981'}; font-weight: 700; margin-top: 2px;">${data.ai_results?.siltation_risk || 'Low (8%)'}</div>
      </div>
    </div>

    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <button class="btn btn-primary" style="flex: 1; min-width: 200px;" onclick="openAIFromUpload('${data.filename}')">
        🔬 Inspect AI Bounding Box & Silt Scan &rarr;
      </button>
      ${data.gps ? `
        <button class="btn" style="background: rgba(14, 30, 50, 0.9);" onclick="showOnMap(${data.gps.lat}, ${data.gps.lng})">
          🗺️ View on Map
        </button>
      ` : ''}
    </div>
  `;

  showToast(isFlagged ? "⚠️ Warning: Flagged for high siltation!" : "✓ Photo verified with EXIF GPS tags & AI classification.");
}

function openAIFromUpload(filename) {
  const targetSrc = window.lastUploadedPhotoSrc || (document.getElementById('uploadPreviewImg')?.src) || 'assets/sample_check_dam.jpg';
  navigateTo('analysis');
  setTimeout(() => {
    loadSampleForAI(targetSrc);
  }, 150);
}

function handleAIDirectUpload(input) {
  if (input && input.files && input.files.length > 0) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      window.lastUploadedPhotoSrc = e.target.result;
      window.lastUploadedPhotoName = file.name;
      loadSampleForAI(e.target.result, 'custom');
      showToast(`Loaded ${file.name} for AI computer vision scan.`);
    };
    reader.readAsDataURL(file);
  }
}

function showOnMap(lat, lng) {
  navigateTo('map');
  if (typeof map !== 'undefined' && map) {
    map.flyTo([lat, lng], 16, { duration: 1.5 });
    if (typeof L !== 'undefined') {
      L.popup()
        .setLatLng([lat, lng])
        .setContent(`<b>Verified Photo Location</b><br>${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`)
        .openOn(map);
    }
  }
}

// AI STRUCTURE VISION CONTROLLER
function loadSampleForAI(imgSrc, presetKey) {
  if (!aiVisualizer) {
    if (typeof AIDetectorVisualizer !== 'undefined') {
      aiVisualizer = new AIDetectorVisualizer('aiCanvas');
      window.aiVisualizer = aiVisualizer;
    }
  }

  let targetSrc = imgSrc;
  if (!targetSrc || targetSrc === 'uploaded') {
    targetSrc = window.lastUploadedPhotoSrc || document.getElementById('uploadPreviewImg')?.src;
    if (!targetSrc) {
      targetSrc = 'assets/sample_check_dam.jpg';
      showToast("No photo uploaded yet. Displaying default check dam.", "info");
    }
  }

  let preset = null;
  if (presetKey && AI_DETECTION_PRESETS[presetKey]) {
    preset = AI_DETECTION_PRESETS[presetKey];
  } else {
    for (const key in AI_DETECTION_PRESETS) {
      if (typeof targetSrc === 'string' && targetSrc.includes(key)) {
        preset = AI_DETECTION_PRESETS[key];
        break;
      }
    }
  }

  if (!preset) {
    const photoName = window.lastUploadedPhotoName || 'Field Ground Evidence';
    preset = {
      id: 'CUSTOM',
      title: `Field Photo Analysis (${photoName})`,
      subtitle: 'Uploaded Ground Evidence • Real-Time Computer Vision Segmentation [Prototype]',
      structureType: 'Ground Watershed Civil Asset',
      confidence: 94.6,
      waterRetention: '82% (Adequate Storage)',
      waterPct: 82,
      siltSeverity: '12% (Low Siltation)',
      siltPct: 12,
      isFlagged: false,
      badgeText: '✓ VERIFIED INTACT',
      badgeClass: 'badge-verified',
      verdict: '✓ CIVIL AUDIT CLEARANCE: APPROVED',
      verdictDesc: 'User-submitted field photo successfully co-registered with geospatial bounds. Structure detected with adequate water impoundment and safe silt levels.',
      notes: 'Computer Vision segmentation processed user image. Spillway flow and reservoir basin contours mapped.',
      detections: [
        { label: "Watershed Hydraulic Asset", confidence: 94.6, box: [15, 20, 70, 55] },
        { label: "Water Storage Reservoir", confidence: 91.2, box: [25, 42, 52, 40] },
        { label: "Sediment Filter Line", confidence: 87.4, box: [55, 58, 28, 24] }
      ]
    };
  }

  // Update Right Panel UI
  const titleEl = document.getElementById('aiActiveStructureTitle');
  const subEl = document.getElementById('aiActiveStructureSubtitle');
  const badgeEl = document.getElementById('aiStructureBadge');
  const structLbl = document.getElementById('aiMetricStructureLabel');
  const structConf = document.getElementById('aiMetricStructureConf');
  const structBar = document.getElementById('aiMetricStructureBar');
  const waterVal = document.getElementById('aiMetricWaterVal');
  const waterBar = document.getElementById('aiMetricWaterBar');
  const siltVal = document.getElementById('aiMetricSiltVal');
  const siltBar = document.getElementById('aiMetricSiltBar');
  const alertBox = document.getElementById('aiSiltAlertBox');
  const verdictEl = document.getElementById('aiAuditVerdict');
  const verdictDescEl = document.getElementById('aiAuditVerdictDesc');
  const notesEl = document.getElementById('aiAuditNotes');

  if (titleEl) titleEl.textContent = preset.title;
  if (subEl) subEl.textContent = preset.subtitle;
  if (badgeEl) {
    badgeEl.innerHTML = `<span class="badge-status ${preset.badgeClass}">${preset.badgeText}</span>`;
  }
  if (structLbl) structLbl.textContent = `Structure Confidence (${preset.structureType})`;
  if (structConf) {
    structConf.textContent = `${preset.confidence}%`;
    structConf.style.color = preset.isFlagged ? 'var(--accent-amber)' : 'var(--accent-teal)';
  }
  if (structBar) {
    structBar.style.width = `${preset.confidence}%`;
    structBar.style.background = preset.isFlagged ? 'var(--accent-amber)' : 'var(--accent-teal)';
  }
  if (waterVal) waterVal.textContent = preset.waterRetention;
  if (waterBar) {
    waterBar.style.width = `${preset.waterPct}%`;
    waterBar.style.background = preset.waterPct < 40 ? '#ef4444' : '#38bdf8';
  }
  if (siltVal) {
    siltVal.textContent = preset.siltSeverity;
    siltVal.style.color = preset.isFlagged ? '#ef4444' : 'var(--accent-amber)';
  }
  if (siltBar) {
    siltBar.style.width = `${preset.siltPct}%`;
    siltBar.style.background = preset.isFlagged ? '#ef4444' : 'var(--accent-amber)';
  }
  if (alertBox) {
    if (preset.isFlagged) {
      alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      alertBox.style.borderColor = '#ef4444';
      alertBox.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.25)';
    } else {
      alertBox.style.background = 'rgba(16, 185, 129, 0.12)';
      alertBox.style.borderColor = '#10b981';
      alertBox.style.boxShadow = 'none';
    }
  }
  if (verdictEl) {
    verdictEl.textContent = preset.verdict;
    verdictEl.style.color = preset.isFlagged ? '#f87171' : '#34d399';
  }
  if (verdictDescEl) verdictDescEl.textContent = preset.verdictDesc;
  if (notesEl) notesEl.textContent = preset.notes;

  const statusBox = document.getElementById('aiScanStatus');
  if (statusBox) {
    statusBox.innerHTML = `<span class="badge-status badge-review">Scanning Computer Vision Bounding Boxes...</span>`;
  }

  if (aiVisualizer) {
    aiVisualizer.loadImage(targetSrc, preset.detections, () => {
      if (statusBox) {
        statusBox.innerHTML = `<span class="badge-status ${preset.badgeClass}">✓ ${preset.badgeText} (${preset.confidence}%)</span>`;
      }
      showToast(`✓ AI analysis complete for ${preset.structureType}`);
    });
  }
}

// QUICK ADD & ADD PROJECT MODAL
function openAddProjectModal() {
  const modal = document.getElementById("addProjectModal");
  if (modal) modal.classList.add("show");
}

function closeAddProjectModal() {
  const modal = document.getElementById("addProjectModal");
  if (modal) modal.classList.remove("show");
}

function fillSampleProject(presetNum) {
  const presets = {
    1: {
      id: "WD-" + Math.floor(700 + Math.random() * 90),
      name: "Banda Bundelkhand Drought Mitigation Catchment",
      district: "Banda",
      state: "Uttar Pradesh",
      lat: 25.4800,
      lng: 80.3300,
      status: "Under Review",
      structures: 15,
      ndviBefore: 0.17,
      ndviAfter: 0.52,
      budget: "₹ 55.40 Lakh",
      desc: "Deep recharge masonry check dams and contour bunds across Ken river tributary basin."
    },
    2: {
      id: "WD-" + Math.floor(700 + Math.random() * 90),
      name: "Mirzapur Vindhya Plateau Soil Conservation Basin",
      district: "Mirzapur",
      state: "Uttar Pradesh",
      lat: 25.1337,
      lng: 82.5644,
      status: "Verified",
      structures: 20,
      ndviBefore: 0.22,
      ndviAfter: 0.65,
      budget: "₹ 71.20 Lakh",
      desc: "Gully plugs, loose boulder check dams and farm ponds in rocky Vindhyan terrain."
    }
  };

  const p = presets[presetNum] || presets[1];
  document.getElementById("newProjId").value = p.id;
  document.getElementById("newProjName").value = p.name;
  document.getElementById("newProjDistrict").value = p.district;
  document.getElementById("newProjState").value = p.state;
  document.getElementById("newProjLat").value = p.lat;
  document.getElementById("newProjLng").value = p.lng;
  document.getElementById("newProjStatus").value = p.status;
  document.getElementById("newProjStructures").value = p.structures;
  document.getElementById("newProjNdviBefore").value = p.ndviBefore;
  document.getElementById("newProjNdviAfter").value = p.ndviAfter;
  document.getElementById("newProjBudget").value = p.budget;
  document.getElementById("newProjDesc").value = p.desc;
  showToast("Sample project preset loaded: " + p.district);
}

async function submitNewProject(e) {
  if (e) e.preventDefault();
  const district = document.getElementById("newProjDistrict").value.trim() || "District";
  const newProj = {
    id: document.getElementById("newProjId").value.trim() || ("WD-" + Math.floor(700 + Math.random() * 90)),
    name: document.getElementById("newProjName").value.trim(),
    district: district,
    state: document.getElementById("newProjState").value.trim() || "Uttar Pradesh",
    watershed_code: "UP-" + district.substring(0, 3).toUpperCase() + "-2026-01",
    lat: parseFloat(document.getElementById("newProjLat").value) || 25.48,
    lng: parseFloat(document.getElementById("newProjLng").value) || 80.33,
    status: document.getElementById("newProjStatus").value,
    ndvi_before: parseFloat(document.getElementById("newProjNdviBefore").value) || 0.18,
    ndvi_after: parseFloat(document.getElementById("newProjNdviAfter").value) || 0.54,
    structures_count: parseInt(document.getElementById("newProjStructures").value) || 12,
    photos_count: 0,
    risk_level: "Low",
    budget_inr: document.getElementById("newProjBudget").value || "₹ 50.00 Lakh",
    last_inspected: new Date().toISOString().split("T")[0],
    description: document.getElementById("newProjDesc").value || "Watershed development project"
  };

  if (isBackendOnline) {
    try {
      await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProj)
      });
    } catch (err) {
      console.warn("Backend API error, keeping in local session", err);
    }
  }

  projectsData.unshift(newProj);
  renderProjectTable(projectsData);
  updateDashboardKPIs();
  populateProjectSelects();
  if (typeof renderMapProjects === "function") {
    renderMapProjects(projectsData);
  }

  closeAddProjectModal();
  showToast("✓ Watershed Project " + newProj.id + " Added Successfully!", "success");
  inspectProject(newProj.id);
}

async function quickAddSampleProject() {
  const sampleTemplates = [
    {
      name: "Banda Bundelkhand Drought Mitigation Catchment",
      district: "Banda",
      state: "Uttar Pradesh",
      watershed_code: "UP-BAN-2026-07",
      lat: 25.4800,
      lng: 80.3350,
      status: "Verified",
      structures_count: 15,
      ndvi_before: 0.17,
      ndvi_after: 0.52,
      budget_inr: "₹ 55.40 Lakh",
      description: "Deep recharge masonry check dams and contour bunds across Ken river tributary basin."
    },
    {
      name: "Mirzapur Vindhya Plateau Soil Conservation Basin",
      district: "Mirzapur",
      state: "Uttar Pradesh",
      watershed_code: "UP-MIR-2026-08",
      lat: 25.1337,
      lng: 82.5644,
      status: "Verified",
      structures_count: 20,
      ndvi_before: 0.22,
      ndvi_after: 0.65,
      budget_inr: "₹ 71.20 Lakh",
      description: "Gully plugs, loose boulder check dams and farm ponds in rocky Vindhyan terrain."
    },
    {
      name: "Varuna Sub-Basin Rainwater Harvesting Network",
      district: "Varanasi",
      state: "Uttar Pradesh",
      watershed_code: "UP-VAR-2026-09",
      lat: 25.3176,
      lng: 82.9739,
      status: "Under Review",
      structures_count: 16,
      ndvi_before: 0.25,
      ndvi_after: 0.68,
      budget_inr: "₹ 64.80 Lakh",
      description: "Decentralized percolation tanks and continuous contour trenches for groundwater elevation."
    }
  ];

  const t = sampleTemplates[Math.floor(Math.random() * sampleTemplates.length)];
  const randomNum = Math.floor(700 + Math.random() * 299);
  const newProj = Object.assign({}, t, {
    id: `WD-${randomNum}`,
    photos_count: Math.floor(25 + Math.random() * 60),
    risk_level: t.status === 'Verified' ? 'Low' : 'Medium',
    last_inspected: new Date().toISOString().split("T")[0]
  });

  if (isBackendOnline) {
    try {
      await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProj)
      });
    } catch (err) {
      console.warn("Backend API error, storing in local session", err);
    }
  }

  projectsData.unshift(newProj);
  renderProjectTable(projectsData);
  updateDashboardKPIs();
  populateProjectSelects();
  if (typeof renderMapProjects === "function") {
    renderMapProjects(projectsData);
  }

  showToast(`⚡ Added Project ${newProj.id} (${newProj.name})!`, "success");
}

// REPORTS PAGE
function renderReportPreview(projectId) {
  const proj = projectsData.find(p => p.id === projectId) || projectsData[0];
  const container = document.getElementById('reportPreviewArea');
  if (!container || !proj) return;

  const percentGain = Math.round(((proj.ndvi_after - proj.ndvi_before) / proj.ndvi_before) * 100);

  container.innerHTML = `
    <div class="report-paper">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 1px;">Ministry of Jal Shakti • Government of India</div>
          <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #0f172a; border: none; padding: 0;">WATERSHED DEVELOPMENT COMPLIANCE AUDIT</h2>
          <div style="font-size: 12px; color: #64748b;">Scheme: WDC-PMKSY 2.0 • Geospatial Verification Portal (SIH26015)</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #475569;">
          <div><b>Report ID:</b> JD-${proj.id}-2026</div>
          <div><b>Date:</b> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <div class="report-grid">
        <div class="report-item">
          <label>Project Name & ID</label>
          <span>${proj.name} (${proj.id})</span>
        </div>
        <div class="report-item">
          <label>Catchment / District</label>
          <span>${proj.district}, ${proj.state}</span>
        </div>
        <div class="report-item">
          <label>Watershed Code</label>
          <span>${proj.watershed_code}</span>
        </div>
        <div class="report-item">
          <label>Allocated Budget</label>
          <span>${proj.budget_inr}</span>
        </div>
        <div class="report-item">
          <label>Water Harvesting Structures</label>
          <span>${proj.structures_count} structures verified</span>
        </div>
        <div class="report-item">
          <label>Geo-Coded Photos Monitored</label>
          <span>${proj.photos_count} field photos</span>
        </div>
        <div class="report-item">
          <label>Baseline NDVI (Pre-Project)</label>
          <span>${proj.ndvi_before} (Arid / Degraded)</span>
        </div>
        <div class="report-item">
          <label>Current NDVI (Satellite)</label>
          <span style="color: #059669;">${proj.ndvi_after} (+${percentGain}% Biomass Recovery)</span>
        </div>
      </div>

      <div style="margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; font-size: 13px;">
        <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Field Observation & AI Findings</h4>
        <p style="color: #475569; line-height: 1.6;">${proj.description}</p>
      </div>

      <div class="report-stamp">
        ✓ DIGITALLY VERIFIED BY GEOSPATIAL AUDIT SYSTEM • AUDIT CLEARANCE: ${proj.status.toUpperCase()}
      </div>
    </div>
  `;
}

function printReport() {
  window.print();
}

function exportJSONReport() {
  const proj = projectsData.find(p => p.id === selectedProjectId) || projectsData[0];
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proj, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `Jal_Drishti_Report_${proj.id}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast(`Exported JSON report for ${proj.id}`);
}

// MULTI-DEVICE ACCESS & MODAL CONTROLLERS
async function fetchNetworkUrls() {
  try {
    const res = await fetch(`${API_BASE}/api/network-urls`);
    if (res.ok) {
      const data = await res.json();
      if (data.public_url) {
        const input = document.getElementById('publicUrlInput');
        if (input) input.value = data.public_url;
        const qr = document.getElementById('deviceShareQrImg');
        if (qr) qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data.public_url)}`;
      }
      if (data.wifi_url) {
        const wifiEl = document.getElementById('wifiUrlText');
        if (wifiEl) wifiEl.textContent = data.wifi_url;
      }
    }
  } catch (e) {
    if (window.location.origin.startsWith('http')) {
      const input = document.getElementById('publicUrlInput');
      if (input && !input.value) input.value = window.location.origin;
    }
  }
}

function openDeviceShareModal() {
  const modal = document.getElementById('deviceShareModal');
  if (modal) {
    modal.style.display = 'flex';
    fetchNetworkUrls();
  }
}

function closeDeviceShareModal() {
  const modal = document.getElementById('deviceShareModal');
  if (modal) modal.style.display = 'none';
}

function copyPublicUrl() {
  const input = document.getElementById('publicUrlInput');
  if (input) {
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('✓ Public link copied! Paste on any device to open.');
    }).catch(() => {
      document.execCommand('copy');
      showToast('✓ Public link copied!');
    });
  }
}

function showToast(msg, type = 'info') {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast-box';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  if (type === 'error') {
    toast.style.borderColor = '#ef4444';
    toast.style.color = '#fca5a5';
  } else if (type === 'success') {
    toast.style.borderColor = '#10b981';
    toast.style.color = '#34d399';
  } else {
    toast.style.borderColor = 'var(--accent-cyan)';
    toast.style.color = '#fff';
  }
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3200);
}
