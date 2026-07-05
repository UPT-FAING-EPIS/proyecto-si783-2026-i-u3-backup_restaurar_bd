use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;

pub fn init_db(app_dir: &PathBuf) -> Result<Connection> {
    if !app_dir.exists() {
        fs::create_dir_all(app_dir).expect("Failed to create app directory");
    }
    let db_path = app_dir.join("safebridge.db");
    let conn = Connection::open(db_path)?;

    // Habilitar Foreign Keys
    conn.execute("PRAGMA foreign_keys = ON;", [])?;

    // Crear tabla connections (T-010)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS connections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            engine TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            database_name TEXT NOT NULL,
            backup_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Crear tabla backup_logs (T-040)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS backup_logs (
            id TEXT PRIMARY KEY,
            connection_id TEXT,
            connection_name TEXT NOT NULL,
            engine TEXT NOT NULL,
            started_at DATETIME NOT NULL,
            finished_at DATETIME NOT NULL,
            duration_seconds INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            file_size_bytes INTEGER NOT NULL,
            status TEXT NOT NULL,
            error_message TEXT,
            restore_verified BOOLEAN NOT NULL,
            full_logs TEXT,
            FOREIGN KEY(connection_id) REFERENCES connections(id) ON DELETE SET NULL
        )",
        [],
    )?;

    // Migración simple: intentar agregar la columna si la tabla ya existía sin ella
    let _ = conn.execute("ALTER TABLE backup_logs ADD COLUMN full_logs TEXT", []);

    // Migración: agregar columna use_ssl a connections (para conexiones cloud que requieren SSL)
    let _ = conn.execute(
        "ALTER TABLE connections ADD COLUMN use_ssl INTEGER NOT NULL DEFAULT 0",
        [],
    );

    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_init_db_creates_tables() {
        let temp_dir = env::temp_dir().join("safebridge_test_db");
        let _ = fs::remove_dir_all(&temp_dir); // Ensure clean state
        
        let conn = init_db(&temp_dir).expect("Failed to init DB");
        
        // Verify connections table exists
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='connections'").unwrap();
        let exists = stmt.exists([]).unwrap();
        assert!(exists, "Table 'connections' should exist");
        
        // Verify backup_logs table exists
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='backup_logs'").unwrap();
        let exists = stmt.exists([]).unwrap();
        assert!(exists, "Table 'backup_logs' should exist");
        
        // Verify use_ssl column exists in connections (Migration check)
        let mut stmt = conn.prepare("PRAGMA table_info(connections)").unwrap();
        let mut has_use_ssl = false;
        let mut rows = stmt.query([]).unwrap();
        while let Some(row) = rows.next().unwrap() {
            let col_name: String = row.get(1).unwrap();
            if col_name == "use_ssl" {
                has_use_ssl = true;
                break;
            }
        }
        assert!(has_use_ssl, "Column 'use_ssl' should exist in 'connections' table");
        
        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }
}
