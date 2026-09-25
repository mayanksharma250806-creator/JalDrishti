// Leaflet Real Satellite GIS Implementation for Jal Drishti • Geo Nexa

let map = null;
let markersLayer = null;
let riskZonesLayer = null;
let boundaryLayer = null;
let currentTileLayer = null;
let labelOverlayLayer = null;
let currentMode = "googleHybrid";

const MAP_TILES = {
  // Real Satellite + Administrative Boundaries & Town Labels
  googleHybrid: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attr: "Imagery &copy; Google, Maxar, CNES/Airbus, Landsat/Copernicus",
    maxZoom: 20
  },
  // High-Resolution Natural Earth Satellite Photo
  esriSat: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19
  },
  // Pure Raw Satellite Photo (No labels)
  googleSat: {
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attr: "Satellite Imagery &copy; Google Earth",
    maxZoom: 20
  },
  // Cartographic Street Map
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }
};

function initMap() {
  if (typeof L === "undefined") {
    console.warn("Leaflet library not loaded yet.");
    return;
  }
  if (map) return;

  const mapElement = document.getElementById("leafletMap");
  if (!mapElement) return;

  try {
    // Center around Uttar Pradesh / Bundelkhand watershed region
    map = L.map("leafletMap", {
      center: [26.8, 79.2],
      zoom: 7,
      zoomControl: true,
      maxZoom: 20
    });

    // DEFAULT LAYER: REAL SATELLITE PHOTO IMAGERY (Google Hybrid)
    currentTileLayer = L.tileLayer(MAP_TILES.googleHybrid.url, {
      maxZoom: MAP_TILES.googleHybrid.maxZoom,
      attribution: MAP_TILES.googleHybrid.attr
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    riskZonesLayer = L.layerGroup().addTo(map);
    boundaryLayer = L.layerGroup().addTo(map);

    renderWatershedBoundaries();

    // Invalidate size once ready
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  } catch (err) {
    console.error("Error initializing Leaflet satellite map:", err);
  }
}

function setSatelliteMode(mode) {
  if (typeof L === "undefined" || !map) return;
  if (!MAP_TILES[mode]) mode = "googleHybrid";
  currentMode = mode;

  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  currentTileLayer = L.tileLayer(MAP_TILES[mode].url, {
    maxZoom: MAP_TILES[mode].maxZoom,
    attribution: MAP_TILES[mode].attr
  }).addTo(map);

  const modeNames = {
    googleHybrid: "🛰️ Real Satellite Imagery + Place Labels",
    esriSat: "🌍 Natural Earth HD Satellite Photo",
    googleSat: "📷 Pure Satellite Photograph (Zero Labels)",
    street: "🗺️ Cartographic Street Map"
  };

  if (window.showToast) {
    window.showToast("Switched map to: " + (modeNames[mode] || mode));
  }
}

function toggleMapLayer() {
  if (currentMode === "googleHybrid" || currentMode === "esriSat") {
    setSatelliteMode("street");
  } else {
    setSatelliteMode("googleHybrid");
  }
}

function createCustomPin(status) {
  if (typeof L === "undefined") return null;
  const color = status === "Verified" ? "#10b981" : (status === "Flagged" ? "#ef4444" : "#f59e0b");
  const glow = status === "Verified" ? "rgba(16, 185, 129, 0.8)" : (status === "Flagged" ? "rgba(239, 68, 68, 0.8)" : "rgba(245, 158, 11, 0.8)");
  
  // Neon glowing pin designed specifically for dark satellite terrain
  const svgIcon = `
    <div style="filter: drop-shadow(0 0 8px ${glow});">
      <svg width="34" height="44" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.163 24.837 0 16 0Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="7" fill="#04101e"/>
        <circle cx="16" cy="16" r="4" fill="${color}"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    className: "custom-map-pin",
    html: svgIcon,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40]
  });
}

function renderMapProjects(projects) {
  if (typeof L === "undefined") {
    console.warn("Leaflet not loaded, skipping map markers");
    return;
  }
  if (!map) initMap();
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();
  riskZonesLayer.clearLayers();

  if (!projects || projects.length === 0) return;

  const bounds = [];

  projects.forEach(p => {
    const latLng = [p.lat, p.lng];
    bounds.push(latLng);

    const icon = createCustomPin(p.status);
    const marker = L.marker(latLng, { icon: icon });

    const badgeClass = p.status === "Verified" ? "badge-verified" : (p.status === "Flagged" ? "badge-flagged" : "badge-review");
    const popupContent = `
      <div style="font-family: Inter, sans-serif; color: #0f172a; min-width: 240px; padding: 6px;">
        <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase;">🛰️ SATELLITE MONITORED • ${p.id}</div>
        <h4 style="margin: 4px 0 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${p.name}</h4>
        <div style="margin-bottom: 8px;">
          <span class="badge-status ${badgeClass}">${p.status}</span>
          <span style="font-size: 11px; color: #64748b; margin-left: 6px;">${p.district}, ${p.state}</span>
        </div>
        <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 10px; background: #f1f5f9; padding: 8px; border-radius: 6px;">
          <div><b>Water Assets:</b> ${p.structures_count} structures verified</div>
          <div><b>Geo-photos:</b> ${p.photos_count || 0} captured</div>
          <div><b>NDVI Recovery:</b> <span style="color: #059669; font-weight: 700;">${p.ndvi_before} &rarr; ${p.ndvi_after} (+${Math.round((p.ndvi_after - p.ndvi_before)*100)}%)</span></div>
          <div><b>GPS Centroid:</b> ${p.lat.toFixed(4)}° N, ${p.lng.toFixed(4)}° E</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button onclick="zoomToProject(${p.lat}, ${p.lng})" style="flex: 1; background: #0f172a; color: #38bdf8; border: 1px solid #38bdf8; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            🔍 Satellite HD Zoom
          </button>
          <button onclick="inspectProject('${p.id}')" style="flex: 1; background: #0284c7; color: #fff; border: 0; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            Audit &rarr;
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    markersLayer.addLayer(marker);

    // High siltation alert buffer zone
    if (p.status === "Flagged" || p.risk_level === "High") {
      const circle = L.circle(latLng, {
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.25,
        weight: 2,
        radius: 4500
      }).bindTooltip(`Alert: ${p.district} Siltation Risk Catchment`, { permanent: false, direction: "top" });
      riskZonesLayer.addLayer(circle);
    }
  });

  if (bounds.length > 0 && map.getContainer().offsetWidth > 0) {
    try {
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (e) {}
  }
}

function zoomToProject(lat, lng) {
  if (!map) return;
  // Deep zoom to level 16 to inspect agricultural fields, canals and check dam structure
  map.flyTo([lat, lng], 16, { duration: 1.5 });
  if (window.showToast) {
    window.showToast("Zoomed into High-Resolution Satellite View (Level 16)");
  }
}

function renderWatershedBoundaries() {
  if (typeof L === "undefined" || !boundaryLayer) return;
  const sampleBoundaries = [
    // Chhata catchment (Mathura)
    [
      [27.75, 77.45], [27.78, 77.53], [27.72, 77.58], [27.68, 77.51], [27.70, 77.44]
    ],
    // Fatehabad basin (Agra)
    [
      [27.05, 78.25], [27.08, 78.35], [27.01, 78.38], [26.98, 78.28]
    ],
    // Babina reservoir catchment (Jhansi)
    [
      [25.28, 78.42], [25.30, 78.50], [25.22, 78.52], [25.20, 78.44]
    ],
    // Banda Ken-Betwa catchment
    [
      [25.52, 80.28], [25.54, 80.38], [25.44, 80.39], [25.42, 80.29]
    ]
  ];

  sampleBoundaries.forEach((polyCoords, idx) => {
    const polygon = L.polygon(polyCoords, {
      color: "#38bdf8",
      weight: 2,
      dashArray: "6, 6",
      fillColor: "#06b6d4",
      fillOpacity: 0.14
    }).bindTooltip(`Micro-Watershed Drainage Basin #${idx + 1} (Hydrological Catchment)`, { sticky: true });
    boundaryLayer.addLayer(polygon);
  });
}

function fitAllProjects() {
  if (typeof L === "undefined") return;
  if (markersLayer && map) {
    const layers = markersLayer.getLayers();
    if (layers.length > 0) {
      const group = new L.featureGroup(layers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
      showToast("Centered map view on all monitored watershed sites");
    }
  }
}

function locateUser() {
  if (typeof L === "undefined" || !map) return;
  map.locate({ setView: true, maxZoom: 16 });
  map.on("locationfound", (e) => {
    L.circle(e.latlng, { radius: e.accuracy / 2, color: "#38bdf8", fillColor: "#06b6d4", fillOpacity: 0.3 }).addTo(map);
    showToast(`GPS Location found: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
  });
  map.on("locationerror", () => {
    showToast("GPS Location permission unavailable in browser.");
  });
}

window.initMap = initMap;
window.setSatelliteMode = setSatelliteMode;
window.zoomToProject = zoomToProject;
window.fitAllProjects = fitAllProjects;
window.locateUser = locateUser;
window.renderMapProjects = renderMapProjects;
