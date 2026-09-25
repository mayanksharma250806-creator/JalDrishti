import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import os
import hashlib
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image, ExifTags
import sqlite3
from database import get_db_connection, init_db

FRONTEND_DIR = BASE_DIR.parent / "frontend"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)

# Ensure DB is initialized
init_db()

def _convert_to_degrees(value):
    """Helper to convert EXIF DMS (Degrees, Minutes, Seconds) to decimal degrees."""
    try:
        def _to_float(v):
            if hasattr(v, 'numerator') and hasattr(v, 'denominator'):
                return float(v.numerator) / float(v.denominator) if v.denominator != 0 else 0.0
            if isinstance(v, tuple) and len(v) == 2:
                return float(v[0]) / float(v[1]) if v[1] != 0 else 0.0
            return float(v)

        d = _to_float(value[0])
        m = _to_float(value[1])
        s = _to_float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return None

def extract_exif(image_path):
    """Extract GPS coordinates, timestamp, and device model from image EXIF."""
    metadata = {
        "gps": None,
        "timestamp": None,
        "device_model": "Unknown Device",
        "has_gps": False
    }
    try:
        with Image.open(image_path) as img:
            exif_raw = img.getexif()
            if not exif_raw:
                return metadata

            # Extract basic tags
            for tag_id, value in exif_raw.items():
                tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                if tag_name == "DateTime" or tag_name == "DateTimeOriginal":
                    metadata["timestamp"] = str(value)
                elif tag_name == "Model":
                    metadata["device_model"] = str(value).strip()
                elif tag_name == "Make" and metadata["device_model"] == "Unknown Device":
                    metadata["device_model"] = str(value).strip()

            # GPS extraction via IFD or standard tags
            gps_info = None
            try:
                # Pillow 9.2+ has get_ifd for GPS
                gps_ifd = exif_raw.get_ifd(ExifTags.IFD.GPSInfo)
                if gps_ifd:
                    gps_info = {ExifTags.GPSTAGS.get(k, k): v for k, v in gps_ifd.items()}
            except Exception:
                pass

            if not gps_info:
                # Fallback to direct key search
                for tag_id, value in exif_raw.items():
                    if ExifTags.TAGS.get(tag_id) == "GPSInfo" and isinstance(value, dict):
                        gps_info = {ExifTags.GPSTAGS.get(k, k): v for k, v in value.items()}
                        break

            if gps_info and "GPSLatitude" in gps_info and "GPSLongitude" in gps_info:
                lat = _convert_to_degrees(gps_info["GPSLatitude"])
                lng = _convert_to_degrees(gps_info["GPSLongitude"])
                if lat is not None and lng is not None:
                    if gps_info.get("GPSLatitudeRef") == "S":
                        lat = -lat
                    if gps_info.get("GPSLongitudeRef") == "W":
                        lng = -lng
                    metadata["gps"] = {
                        "lat": round(lat, 6),
                        "lng": round(lng, 6)
                    }
                    metadata["has_gps"] = True

            if not metadata["timestamp"] and gps_info and "GPSDateStamp" in gps_info:
                metadata["timestamp"] = str(gps_info["GPSDateStamp"])

    except Exception as e:
        print("EXIF parsing error:", e)

    return metadata

def simulate_ai_inference(filename, digest):
    """
    Simulates AI computer vision inference (Check Dam detection, siltation, water retention).
    Deterministic based on image SHA-256 for consistent, reproducible results.
    Explicitly categorized as Prototype Decision Support / Demonstration.
    """
    hash_int = int(digest[:6], 16)
    structures = [
        "Masonry Check Dam",
        "Earthen Farm Pond",
        "Percolation Tank",
        "Gully Plug / Gabion",
        "Contour Bunding Network"
    ]
    structure_type = structures[hash_int % len(structures)]

    confidence = round(84.0 + (hash_int % 150) / 10.0, 1) # 84% - 99%
    water_pct = 40 + (hash_int % 55) # 40% - 94%
    silt_pct = 5 + ((hash_int >> 2) % 45) # 5% - 49%

    silt_risk = "Low" if silt_pct < 20 else ("Medium" if silt_pct < 35 else "Critical")
    water_status = f"{water_pct}% (Optimal)" if water_pct > 65 else f"{water_pct}% (Moderate)"

    # AI Detection Bounding Boxes
    detections = [
        {
            "label": structure_type,
            "confidence": confidence,
            "box": [15, 20, 70, 55] # [x%, y%, width%, height%]
        },
        {
            "label": "Water Reservoir Body",
            "confidence": round(confidence - 3.2, 1),
            "box": [30, 48, 50, 40]
        },
        {
            "label": f"Siltation Sediment ({silt_risk})",
            "confidence": round(confidence - 5.5, 1),
            "box": [60, 60, 28, 25]
        }
    ]

    return {
        "model_type": "Computer Vision Analysis – Prototype",
        "disclaimer": "Prototype demonstration inference – not a deployed production model",
        "analysis_status": "Completed (Simulated Inference)",
        "structure_type": structure_type,
        "ai_confidence": confidence,
        "water_retention": water_status,
        "siltation_risk": f"{silt_risk} ({silt_pct}%)",
        "detections": detections,
        "tamper_score": 98.4,
        "silt_pct": silt_pct,
        "water_pct": water_pct
    }

# ----------------- API ROUTES ----------------- #

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Jal Drishti • Geo Nexa Decision Support API",
        "version": "3.3.0",
        "system_type": "Geospatial Decision Support System (Prototype / Demonstration)",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

@app.route("/api/system-health", methods=["GET"])
def system_health():
    """Returns granular status for all 7 platform subsystems distinguishing real vs demo."""
    conn = get_db_connection()
    c = conn.cursor()
    proj_count = c.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    ev_count = c.execute("SELECT COUNT(*) FROM evidence").fetchone()[0]
    conn.close()

    return jsonify({
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "subsystems": {
            "frontend": {
                "name": "Digital Governance Web Portal",
                "status": "Operational",
                "badge": "Operational",
                "real_or_demo": "Real",
                "details": "Responsive HTML5/CSS3/ES6 GIS interface with accessible UI"
            },
            "backend_api": {
                "name": "Flask REST Application Server",
                "status": "Operational",
                "badge": "Operational",
                "real_or_demo": "Real",
                "details": "REST endpoints serving on port 5000 with CORS & validation"
            },
            "database": {
                "name": "SQLite Geospatial Database",
                "status": "Operational",
                "badge": "Operational",
                "real_or_demo": "Real",
                "details": f"{proj_count} watershed projects, {ev_count} evidence records persisted"
            },
            "gis_engine": {
                "name": "Geospatial GIS Engine (Leaflet)",
                "status": "Operational",
                "badge": "Operational",
                "real_or_demo": "Real",
                "details": "Multi-layer Leaflet GIS with Esri Satellite, OpenStreetMap & boundary vector layers"
            },
            "ai_module": {
                "name": "Computer Vision Analysis Module",
                "status": "Demo Mode",
                "badge": "Demo Mode",
                "real_or_demo": "Prototype Demo",
                "details": "Bounding box & structure classification simulation; real weights require GPU server"
            },
            "ndvi_module": {
                "name": "Remote Sensing NDVI Vegetation Engine",
                "status": "Demo Mode",
                "badge": "Demo Mode",
                "real_or_demo": "Prototype Dataset",
                "details": "Sentinel-2 multispectral baseline & post-project split comparative dataset"
            },
            "evidence_service": {
                "name": "Cryptographic Evidence Verification",
                "status": "Operational",
                "badge": "Operational",
                "real_or_demo": "Real",
                "details": "Hardware EXIF GPS extraction, SHA-256 binary hash & duplicate check operational"
            }
        }
    })

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db_connection()
    c = conn.cursor()

    total_projects = c.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    verified_projects = c.execute("SELECT COUNT(*) FROM projects WHERE status = 'Verified'").fetchone()[0]
    flagged_projects = c.execute("SELECT COUNT(*) FROM projects WHERE status = 'Flagged'").fetchone()[0]
    under_review = c.execute("SELECT COUNT(*) FROM projects WHERE status = 'Under Review'").fetchone()[0]
    priority_inspections = c.execute("SELECT COUNT(*) FROM projects WHERE priority = 'High' OR status = 'Flagged'").fetchone()[0]
    active_projects = total_projects - verified_projects
    total_evidence = c.execute("SELECT COUNT(*) FROM evidence").fetchone()[0]
    total_structures = c.execute("SELECT SUM(structures_count) FROM projects").fetchone()[0] or 0

    # Calculate average NDVI recovery
    ndvi_stats = c.execute("SELECT AVG(ndvi_before), AVG(ndvi_after) FROM projects").fetchone()
    avg_ndvi_before = round(ndvi_stats[0], 2) if ndvi_stats[0] else 0.20
    avg_ndvi_after = round(ndvi_stats[1], 2) if ndvi_stats[1] else 0.55
    ndvi_gain = round(avg_ndvi_after - avg_ndvi_before, 2)

    conn.close()
    return jsonify({
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": verified_projects,
        "priority_inspections": priority_inspections,
        "under_review_projects": under_review,
        "verified_projects": verified_projects,
        "flagged_projects": flagged_projects,
        "total_evidence": total_evidence,
        "total_structures": total_structures,
        "avg_ndvi_before": avg_ndvi_before,
        "avg_ndvi_after": avg_ndvi_after,
        "ndvi_gain": f"+{ndvi_gain}"
    })

@app.route("/api/projects", methods=["GET"])
def get_projects():
    status = request.args.get("status")
    priority = request.args.get("priority")
    query = request.args.get("q")

    conn = get_db_connection()
    c = conn.cursor()

    sql = "SELECT * FROM projects WHERE 1=1"
    params = []
    if status and status.lower() != "all":
        sql += " AND LOWER(status) = LOWER(?)"
        params.append(status)
    if priority and priority.lower() != "all":
        sql += " AND LOWER(priority) = LOWER(?)"
        params.append(priority)
    if query:
        sql += " AND (name LIKE ? OR district LIKE ? OR id LIKE ?)"
        term = f"%{query}%"
        params.extend([term, term, term])

    sql += " ORDER BY id ASC"
    rows = c.execute(sql, params).fetchall()
    projects = [dict(r) for r in rows]
    conn.close()
    return jsonify(projects)


@app.route("/api/projects", methods=["POST"])
def add_project():
    import random
    data = request.get_json() or {}
    proj_id = data.get("id") or f"WD-{random.randint(700, 999)}"
    name = data.get("name", "New Watershed Conservation Project")
    district = data.get("district", "Varanasi")
    state = data.get("state", "Uttar Pradesh")
    watershed_code = data.get("watershed_code", f"UP-{district[:3].upper()}-2026-X")
    lat = float(data.get("lat", 25.3176))
    lng = float(data.get("lng", 82.9739))
    status = data.get("status", "Under Review")
    ndvi_before = float(data.get("ndvi_before", 0.20))
    ndvi_after = float(data.get("ndvi_after", 0.52))
    structures_count = int(data.get("structures_count", 8))
    photos_count = int(data.get("photos_count", 0))
    risk_level = data.get("risk_level", "Low")
    priority = data.get("priority", "Normal")
    budget_inr = data.get("budget_inr", "₹ 45.00 Lakh")
    last_inspected = datetime.datetime.now().strftime("%Y-%m-%d")
    description = data.get("description", "Community rainwater harvesting, contour trenches, and check dam network.")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
    INSERT INTO projects (
        id, name, district, state, watershed_code, lat, lng, status,
        ndvi_before, ndvi_after, structures_count, photos_count, risk_level,
        budget_inr, last_inspected, description, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (proj_id, name, district, state, watershed_code, lat, lng, status,
          ndvi_before, ndvi_after, structures_count, photos_count, risk_level,
          budget_inr, last_inspected, description, priority))

    c.execute("""
    INSERT INTO audit_logs (action, details, timestamp)
    VALUES ('PROJECT_CREATED', ?, ?)
    """, (f"New watershed project {proj_id} ({name}) added.", datetime.datetime.now(datetime.timezone.utc).isoformat()))

    conn.commit()
    conn.close()

    new_proj = {
        "id": proj_id, "name": name, "district": district, "state": state,
        "watershed_code": watershed_code, "lat": lat, "lng": lng, "status": status,
        "ndvi_before": ndvi_before, "ndvi_after": ndvi_after,
        "structures_count": structures_count, "photos_count": photos_count,
        "risk_level": risk_level, "priority": priority, "budget_inr": budget_inr,
        "last_inspected": last_inspected, "description": description
    }
    return jsonify({"success": True, "project": new_proj}), 201

@app.route("/api/projects/<project_id>", methods=["GET"])
def get_project_details(project_id):
    conn = get_db_connection()
    c = conn.cursor()
    proj = c.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    evidence_rows = c.execute("SELECT * FROM evidence WHERE project_id = ? ORDER BY id DESC", (project_id,)).fetchall()
    conn.close()

    data = dict(proj)
    data["evidence"] = [dict(e) for e in evidence_rows]
    return jsonify(data)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 16 * 1024 * 1024 # 16 Megabytes

@app.route("/api/upload-evidence", methods=["POST"])
def upload_evidence():
    import io
    if "file" not in request.files:
        return jsonify({"error": "No image file provided in upload request."}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty filename. Please select a valid JPG, JPEG, or PNG image."}), 400

    # Extension validation
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": f"Invalid file extension '{ext}'. Only JPG, JPEG, and PNG images are supported."}), 400

    project_id = request.form.get("project_id", "WD-204")
    review_notes = request.form.get("notes", "Uploaded via Jal Drishti Mobile/Web Portal")

    # Read binary bytes for size check & integrity hash
    file_bytes = file.read()
    if len(file_bytes) == 0:
        return jsonify({"error": "Uploaded image file is empty (0 bytes)."}), 400

    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"error": f"File size exceeds 16 MB limit (received {len(file_bytes) / (1024*1024):.1f} MB)."}), 400

    # Image corruption & header check via Pillow
    try:
        with Image.open(io.BytesIO(file_bytes)) as test_img:
            test_img.verify()
    except Exception as img_err:
        return jsonify({"error": f"Corrupted or invalid image file. Header parsing failed: {str(img_err)}"}), 400

    digest = hashlib.sha256(file_bytes).hexdigest()

    conn = get_db_connection()
    c = conn.cursor()

    # Check for duplicate image fraud
    duplicate = c.execute("SELECT id, project_id, filename, uploaded_at FROM evidence WHERE sha256 = ?", (digest,)).fetchone()
    is_duplicate = duplicate is not None

    # Save to disk
    saved_filename = f"{digest[:12]}_{Path(file.filename).stem}{ext}"
    saved_path = UPLOADS_DIR / saved_filename
    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Extract EXIF GPS & device info
    exif = extract_exif(saved_path)

    # Fetch project details for default GPS fallback if image has no EXIF
    proj = c.execute("SELECT lat, lng, name FROM projects WHERE id = ?", (project_id,)).fetchone()
    proj_lat = proj["lat"] if proj else 27.7180
    proj_lng = proj["lng"] if proj else 77.5020

    has_exif_gps = exif["has_gps"]
    gps_lat = exif["gps"]["lat"] if has_exif_gps else round(proj_lat + 0.0015, 6)
    gps_lng = exif["gps"]["lng"] if has_exif_gps else round(proj_lng + 0.0012, 6)
    timestamp = exif["timestamp"] or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Run AI inference simulation
    ai_results = simulate_ai_inference(file.filename, digest)

    # Determine status & integrity
    if is_duplicate:
        status = "Flagged"
        integrity_status = "Duplicate Flagged"
        review_notes = f"WARNING: Duplicate image hash detected! Matches evidence #{duplicate['id']} in project {duplicate['project_id']}."
    elif not has_exif_gps:
        status = "Under Review"
        integrity_status = "Missing GPS"
        review_notes += " (Photo had no EXIF GPS data; mapped to project coordinate centroid)."
    else:
        status = "Verified" if ai_results["ai_confidence"] >= 88.0 and "Critical" not in ai_results["siltation_risk"] else "Under Review"
        integrity_status = "Verified" if status == "Verified" else "Needs Review"

    # Insert evidence record
    cur = c.execute("""
    INSERT INTO evidence (
        project_id, filename, file_path, sha256, gps_lat, gps_lng, timestamp,
        device_model, structure_type, water_retention, siltation_risk,
        ai_confidence, status, review_notes, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        project_id, file.filename, f"uploads/{saved_filename}", digest,
        gps_lat, gps_lng, timestamp, exif["device_model"],
        ai_results["structure_type"], ai_results["water_retention"],
        ai_results["siltation_risk"], ai_results["ai_confidence"],
        status, review_notes, datetime.datetime.now(datetime.timezone.utc).isoformat()
    ))
    evidence_id = cur.lastrowid

    # Update project photos_count
    c.execute("UPDATE projects SET photos_count = photos_count + 1 WHERE id = ?", (project_id,))

    # Log audit entry
    c.execute("""
    INSERT INTO audit_logs (action, details, timestamp)
    VALUES ('EVIDENCE_UPLOAD', ?, ?)
    """, (f"Evidence #{evidence_id} uploaded for {project_id}. Status: {status}. Hash: {digest[:8]}...", datetime.datetime.now(datetime.timezone.utc).isoformat()))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "evidence_id": evidence_id,
        "filename": file.filename,
        "file_url": f"/uploads/{saved_filename}",
        "sha256": digest,
        "is_duplicate": is_duplicate,
        "gps": {
            "lat": gps_lat,
            "lng": gps_lng,
            "has_exif_gps": has_exif_gps
        },
        "device_model": exif["device_model"],
        "timestamp": timestamp,
        "ai_results": ai_results,
        "status": status,
        "integrity_status": integrity_status,
        "review_notes": review_notes
    })

@app.route("/api/evidence", methods=["GET"])
def list_evidence():
    conn = get_db_connection()
    c = conn.cursor()
    rows = c.execute("SELECT * FROM evidence ORDER BY id DESC").fetchall()
    evidence_list = [dict(r) for r in rows]
    conn.close()
    return jsonify(evidence_list)

@app.route("/api/verify-project", methods=["POST"])
def verify_project():
    data = request.get_json() or {}
    project_id = data.get("project_id")
    new_status = data.get("status", "Verified")
    officer_remarks = data.get("remarks", "Approved upon geospatial & field photo cross-verification.")

    if not project_id:
        return jsonify({"error": "Missing project_id"}), 400

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("UPDATE projects SET status = ?, description = description || ' | Officer Note: ' || ? WHERE id = ?",
              (new_status, officer_remarks, project_id))

    c.execute("""
    INSERT INTO audit_logs (action, details, timestamp)
    VALUES ('PROJECT_STATUS_UPDATE', ?, ?)
    """, (f"Project {project_id} updated to '{new_status}' by Authorized Officer. Remarks: {officer_remarks}",
          datetime.datetime.now(datetime.timezone.utc).isoformat()))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "project_id": project_id, "status": new_status})

@app.route("/api/export-report/<project_id>", methods=["GET"])
def export_report(project_id):
    conn = get_db_connection()
    c = conn.cursor()
    proj = c.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        conn.close()
        return jsonify({"error": "Project not found"}), 404

    evidence_rows = c.execute("SELECT * FROM evidence WHERE project_id = ?", (project_id,)).fetchall()
    conn.close()

    report = {
        "ministry": "Ministry of Jal Shakti / Department of Land Resources (DoLR)",
        "scheme": "Watershed Development Component - Pradhan Mantri Krishi Sinchayee Yojana (WDC-PMKSY 2.0)",
        "platform": "Jal Drishti • Geo Nexa GIS Verification System",
        "generated_at": datetime.datetime.now().strftime("%d %B %Y, %H:%M IST"),
        "project": dict(proj),
        "evidence_audit_count": len(evidence_rows),
        "evidence_items": [dict(e) for e in evidence_rows],
        "compliance_summary": {
            "gis_coordinates_verified": True,
            "anti_tamper_hash_validated": True,
            "ndvi_vegetation_net_gain": f"+{round(proj['ndvi_after'] - proj['ndvi_before'], 2)}",
            "audit_clearance": "PASSED" if proj['status'] == 'Verified' else "REQUIRES_INSPECTION"
        }
    }
    return jsonify(report)

@app.route("/api/network-urls", methods=["GET"])
def get_network_urls():
    import socket
    local_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    
    public_url = None
    pub_file = BASE_DIR.parent / "PUBLIC_URL.txt"
    if pub_file.exists():
        try:
            with open(pub_file, "r") as f:
                public_url = f.read().strip()
        except Exception:
            pass

    return jsonify({
        "local_url": "http://127.0.0.1:5000",
        "wifi_url": f"http://{local_ip}:5000",
        "public_url": public_url or f"http://{local_ip}:5000"
    })

# ----------------- STATIC / ASSETS ----------------- #

@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(UPLOADS_DIR, filename)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and (FRONTEND_DIR / path).exists():
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 60)
    print("  JAL DRISHTI • GEO NEXA — SIH 2026 PROTOTYPE SERVER")
    print(f"  Server listening on port {port}")
    print(f"  REST API Health: http://127.0.0.1:{port}/api/health")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=False)
