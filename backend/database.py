import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "jal_drishti.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    # Projects Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        watershed_code TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        status TEXT NOT NULL,
        ndvi_before REAL NOT NULL,
        ndvi_after REAL NOT NULL,
        structures_count INTEGER NOT NULL,
        photos_count INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        budget_inr TEXT NOT NULL,
        last_inspected TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'Normal'
    )
    """)

    # Safe migration: add priority column if table existed without it
    columns = [row[1] for row in cur.execute("PRAGMA table_info(projects)").fetchall()]
    if "priority" not in columns:
        cur.execute("ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'Normal'")

    # Evidence Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        gps_lat REAL,
        gps_lng REAL,
        timestamp TEXT,
        device_model TEXT,
        structure_type TEXT,
        water_retention TEXT,
        siltation_risk TEXT,
        ai_confidence REAL,
        status TEXT DEFAULT 'Under Review',
        review_notes TEXT,
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # Audit Logs
    cur.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    # Seed initial projects if empty
    cur.execute("SELECT COUNT(*) FROM projects")
    if cur.fetchone()[0] == 0:
        seed_projects = [
            (
                "WD-204", "Chhata Micro-Watershed Development", "Mathura", "Uttar Pradesh", "UP-MAT-2026-04",
                27.7180, 77.5020, "Under Review", 0.21, 0.58, 14, 186, "Medium", "₹ 48.50 Lakh", "2026-08-25",
                "Recharge check dams and contour bunding across Yamuna sub-basin catchment.", "Medium"
            ),
            (
                "WD-118", "Fatehabad Arid Land Watershed Project", "Agra", "Uttar Pradesh", "UP-AGR-2026-11",
                27.0200, 78.3100, "Flagged", 0.16, 0.32, 9, 94, "High", "₹ 34.20 Lakh", "2026-09-02",
                "Severe siltation detected in farm ponds; GPS coordinates mismatch on 4 geotagged photos.", "High"
            ),
            (
                "WD-311", "Iglas Rainwater Harvesting Basin", "Aligarh", "Uttar Pradesh", "UP-ALG-2026-09",
                27.7167, 77.9333, "Verified", 0.28, 0.67, 18, 240, "Low", "₹ 62.00 Lakh", "2026-09-08",
                "Successfully rejuvenated 6 percolation tanks with notable groundwater elevation.", "Normal"
            ),
            (
                "WD-402", "Babina Bundelkhand Recharge Network", "Jhansi", "Uttar Pradesh", "UP-JHS-2026-01",
                25.2450, 78.4720, "Verified", 0.18, 0.61, 22, 310, "Low", "₹ 78.90 Lakh", "2026-09-10",
                "Integrated masonry check dam and continuous contour trench network in rocky terrain.", "Normal"
            ),
            (
                "WD-505", "Karwi Sub-Catchment Rejuvenation", "Chitrakoot", "Uttar Pradesh", "UP-CHK-2026-15",
                25.2100, 80.9100, "Verified", 0.24, 0.54, 12, 135, "Low", "₹ 41.30 Lakh", "2026-08-19",
                "Gully plugs and nallah bunds to check runoff velocity and restore topsoil moisture.", "Normal"
            ),
            (
                "WD-612", "Robertsganj Plateau Drainage Basin", "Sonbhadra", "Uttar Pradesh", "UP-SBD-2026-22",
                24.6850, 83.0650, "Under Review", 0.19, 0.44, 11, 108, "Medium", "₹ 53.70 Lakh", "2026-09-01",
                "Hillside trenching and silt detention basins under WDC-PMKSY 2.0 scheme.", "Medium"
            )
        ]
        cur.executemany("""
        INSERT INTO projects (
            id, name, district, state, watershed_code, lat, lng, status,
            ndvi_before, ndvi_after, structures_count, photos_count, risk_level,
            budget_inr, last_inspected, description, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_projects)

        # Seed sample verified evidence
        seed_evidence = [
            (
                "WD-204", "masonry_check_dam_01.jpg", "uploads/sample_check_dam.jpg",
                "a4f89d3c81e9b2075b1c953a3f56e4d9b1e9b2075b1c953a3f56e4d9b1e9b207",
                27.7185, 77.5028, "2026-08-25 10:45:12", "Trimble TDC600 GIS Handheld",
                "Masonry Check Dam", "84% (Optimal)", "Low (8%)", 94.2,
                "Verified", "Structure intact with proper spillway flow and minimal siltation.", "2026-08-25T11:00:00Z"
            ),
            (
                "WD-118", "farm_pond_silt_issue.jpg", "uploads/sample_farm_pond.jpg",
                "7c3b2e1f58a90d4c6b2a1e3f890d4c6b7c3b2e1f58a90d4c6b2a1e3f890d4c6b",
                27.0215, 78.3120, "2026-09-02 14:12:05", "Android Field App",
                "Earthen Farm Pond", "32% (Sub-optimal)", "Critical (68%)", 88.5,
                "Flagged", "Excessive sediment buildup choking inlet channel. Dredging needed.", "2026-09-02T14:30:00Z"
            )
        ]
        cur.executemany("""
        INSERT INTO evidence (
            project_id, filename, file_path, sha256, gps_lat, gps_lng, timestamp,
            device_model, structure_type, water_retention, siltation_risk,
            ai_confidence, status, review_notes, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_evidence)

        # Initial audit log
        cur.execute("""
        INSERT INTO audit_logs (action, details, timestamp)
        VALUES ('SYSTEM_INIT', 'Jal Drishti Geo Nexa Database initialized with watershed regions.', '2026-09-12T10:00:00Z')
        """)
    else:
        # Sync existing project priorities based on risk level if priority is not yet set
        cur.execute("UPDATE projects SET priority = 'High' WHERE (priority IS NULL OR priority = 'Normal') AND (risk_level = 'High' OR status = 'Flagged')")
        cur.execute("UPDATE projects SET priority = 'Medium' WHERE (priority IS NULL OR priority = 'Normal') AND (risk_level = 'Medium' OR status = 'Under Review')")
        cur.execute("UPDATE projects SET priority = 'Normal' WHERE priority IS NULL")

    conn.commit()
    conn.close()
    print("Database initialized successfully at:", DB_PATH)

if __name__ == "__main__":
    init_db()
