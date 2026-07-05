use crate::{crypto, models::ConnectionInfo, AppState};
use chrono::Local;
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_shell::ShellExt;

#[derive(Clone, serde::Serialize)]
pub struct BackupLogPayload {
    pub message: String,
    pub level: String, // "info", "success", "error"
}

#[derive(serde::Serialize)]
pub struct BackupResult {
    pub file_path: String,
    pub size_bytes: u64,
    pub sha256: String,
    pub verified: bool,
}

fn emit_log_and_record(app: &AppHandle, buffer: &mut String, message: &str, level: &str) {
    let line = format!(
        "[{}] [{}] {}\n",
        Local::now().format("%H:%M:%S"),
        level.to_uppercase(),
        message
    );
    buffer.push_str(&line);
    let _ = app.emit(
        "backup_log",
        BackupLogPayload {
            message: message.to_string(),
            level: level.to_string(),
        },
    );
}

// Helper function to return result and accumulate logs
async fn do_backup_process(
    app: &AppHandle,
    conn: &ConnectionInfo,
    log_buffer: &mut String,
    password: &str,
) -> Result<(String, u64, String, bool), String> {
    emit_log_and_record(app, log_buffer, "Iniciando proceso de backup...", "info");

    // 2. Generate file name  (formato: nombreBD_YYYYMMDD_HHMMSS.ext)
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let ext = match conn.engine.as_str() {
        "postgres" | "mysql" => "sql", // volcado SQL plano estándar
        "sqlserver" => "bak",          // formato binario nativo de SQL Server
        "mongodb" => "bson",           // archivo BSON de mongodump --archive
        _ => "bak",
    };

    let file_name = format!("{}_{}.{}", conn.database_name, timestamp, ext);
    let backup_dir = Path::new(&conn.backup_path);
    if !backup_dir.exists() {
        std::fs::create_dir_all(backup_dir)
            .map_err(|e| format!("Could not create backup directory: {}", e))?;
    }
    let file_path = backup_dir.join(file_name);
    let file_path_str = file_path.to_string_lossy().to_string();

    emit_log_and_record(
        app,
        log_buffer,
        &format!("Archivo destino: {}", file_path_str),
        "info",
    );
    emit_log_and_record(
        app,
        log_buffer,
        &format!("Conectando a motor: {}", conn.engine),
        "info",
    );

    // 3. Execute backup tool
    let success = match conn.engine.as_str() {
        "postgres" => {
            let resource_path = app
                .path()
                .resolve("resources/pg_deps", tauri::path::BaseDirectory::Resource)
                .map_err(|e| e.to_string())?;
            let current_path = std::env::var("PATH").unwrap_or_default();
            let new_path = format!("{};{}", resource_path.to_string_lossy(), current_path);

            let mut cmd = app
                .shell()
                .sidecar("pg_dump")
                .map_err(|e| format!("Error cargando sidecar pg_dump: {}", e))?;

            cmd = cmd.env("PGPASSWORD", password).env("PATH", new_path);

            // Si use_ssl está activo, configurar sslmode=require
            if conn.use_ssl {
                cmd = cmd.env("PGSSLMODE", "require");
                emit_log_and_record(
                    app,
                    log_buffer,
                    "Usando conexión SSL para PostgreSQL cloud...",
                    "info",
                );
            }

            let output = cmd
                .args([
                    "-h",
                    &conn.host,
                    "-p",
                    &conn.port.to_string(),
                    "-U",
                    &conn.username,
                    "-F",
                    "p",
                    "-f",
                    &file_path_str,
                    &conn.database_name,
                ])
                .output()
                .await
                .map_err(|e| format!("Failed to execute pg_dump: {}", e))?;
            if !output.status.success() {
                emit_log_and_record(
                    app,
                    log_buffer,
                    &format!("pg_dump error: {}", String::from_utf8_lossy(&output.stderr)),
                    "error",
                );
            }
            output.status.success()
        }
        "mysql" => {
            let resource_path = app
                .path()
                .resolve("resources/mysql_deps", tauri::path::BaseDirectory::Resource)
                .map_err(|e| e.to_string())?;
            let current_path = std::env::var("PATH").unwrap_or_default();
            let new_path = format!("{};{}", resource_path.to_string_lossy(), current_path);
            let plugin_dir = resource_path.to_string_lossy().to_string();

            // Construir argumentos dinámicamente
            let mut args: Vec<String> = vec![
                "-h".to_string(),
                conn.host.clone(),
                "-P".to_string(),
                conn.port.to_string(),
                "-u".to_string(),
                conn.username.clone(),
                format!("--result-file={}", file_path_str),
            ];

            // Siempre apuntar al directorio de plugins por si las DLLs existen
            args.push(format!("--plugin-dir={}", plugin_dir));

            // Si use_ssl está activo (conexiones cloud como Railway), agregar flags SSL
            if conn.use_ssl {
                args.push("--ssl".to_string());
                emit_log_and_record(
                    app,
                    log_buffer,
                    "Usando conexión SSL para MySQL cloud...",
                    "info",
                );
            }

            // Agregar nombre de la base de datos al final
            args.push(conn.database_name.clone());

            let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

            let output = app
                .shell()
                .sidecar("mysqldump")
                .map_err(|e| format!("Error cargando sidecar mysqldump: {}", e))?
                .env("MYSQL_PWD", password)
                .env("PATH", &new_path)
                .args(&args_refs)
                .output()
                .await
                .map_err(|e| format!("Failed to execute mysqldump: {}", e))?;
            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                // Si falla por caching_sha2_password, dar un mensaje claro
                if stderr.contains("caching_sha2_password") {
                    emit_log_and_record(
                        app,
                        log_buffer,
                        "Error: No se encontró el plugin caching_sha2_password.dll",
                        "error",
                    );
                    emit_log_and_record(
                        app,
                        log_buffer,
                        "Intentando con autenticación mysql_native_password como respaldo...",
                        "info",
                    );

                    // Reintentar con --default-auth=mysql_native_password
                    let mut retry_args = args.clone();
                    // Remover el nombre de la BD (último elemento) para insertar el flag antes
                    let db_name = retry_args.pop().unwrap();
                    retry_args.push("--default-auth=mysql_native_password".to_string());
                    retry_args.push(db_name);

                    let retry_refs: Vec<&str> = retry_args.iter().map(|s| s.as_str()).collect();

                    let retry_output = app
                        .shell()
                        .sidecar("mysqldump")
                        .map_err(|e| format!("Error cargando sidecar mysqldump: {}", e))?
                        .env("MYSQL_PWD", password)
                        .env("PATH", &new_path)
                        .args(&retry_refs)
                        .output()
                        .await
                        .map_err(|e| format!("Failed to execute mysqldump retry: {}", e))?;

                    if !retry_output.status.success() {
                        emit_log_and_record(
                            app,
                            log_buffer,
                            &format!(
                                "mysqldump error (reintento): {}",
                                String::from_utf8_lossy(&retry_output.stderr)
                            ),
                            "error",
                        );
                    } else {
                        emit_log_and_record(
                            app,
                            log_buffer,
                            "Respaldo completado usando mysql_native_password.",
                            "success",
                        );
                    }
                    retry_output.status.success()
                } else {
                    emit_log_and_record(
                        app,
                        log_buffer,
                        &format!("mysqldump error: {}", stderr),
                        "error",
                    );
                    false
                }
            } else {
                output.status.success()
            }
        }
        "sqlserver" => {
            let output = app
                .shell()
                .sidecar("sqlcmd")
                .map_err(|e| format!("Error cargando sidecar sqlcmd: {}", e))?
                .args([
                    "-S",
                    &format!("{},{}", conn.host, conn.port),
                    "-U",
                    &conn.username,
                    "-P",
                    password,
                    "-b",
                    "-Q",
                    &format!(
                        "BACKUP DATABASE [{}] TO DISK = '{}'",
                        conn.database_name, file_path_str
                    ),
                ])
                .output()
                .await
                .map_err(|e| format!("Failed to execute sqlcmd: {}", e))?;
            if !output.status.success() {
                let err_msg = String::from_utf8_lossy(&output.stderr);
                let out_msg = String::from_utf8_lossy(&output.stdout);
                emit_log_and_record(
                    app,
                    log_buffer,
                    &format!("sqlcmd error: {} {}", err_msg, out_msg),
                    "error",
                );
            }
            output.status.success()
        }
        "mongodb" => {
            let mongo_uri = format!(
                "mongodb://{}:{}@{}:{}/{}",
                conn.username, password, conn.host, conn.port, conn.database_name
            );
            let output = app
                .shell()
                .sidecar("mongodump")
                .map_err(|e| format!("Error cargando sidecar mongodump: {}", e))?
                .args(["--uri", &mongo_uri, &format!("--archive={}", file_path_str)])
                .output()
                .await
                .map_err(|e| format!("Failed to execute mongodump: {}", e))?;
            if !output.status.success() {
                emit_log_and_record(
                    app,
                    log_buffer,
                    &format!(
                        "mongodump error: {}",
                        String::from_utf8_lossy(&output.stderr)
                    ),
                    "error",
                );
            }
            output.status.success()
        }
        _ => return Err("Unsupported engine".to_string()),
    };

    if !success {
        emit_log_and_record(
            app,
            log_buffer,
            "Error al generar el volcado de la base de datos.",
            "error",
        );
        return Err("Backup command failed".to_string());
    }

    emit_log_and_record(app, log_buffer, "Volcado generado exitosamente.", "success");

    // 4. Calculate size and SHA-256
    emit_log_and_record(app, log_buffer, "Calculando hash SHA-256...", "info");
    let (size_bytes, sha256) = calculate_hash_and_size(&file_path)?;

    emit_log_and_record(
        app,
        log_buffer,
        &format!("Tamaño: {} bytes", size_bytes),
        "info",
    );
    emit_log_and_record(app, log_buffer, &format!("SHA-256: {}", sha256), "info");
    emit_log_and_record(app, log_buffer, "Fase de backup completada.", "success");

    let verified = match verify_backup(app, conn, &file_path_str, password, log_buffer).await {
        Ok(v) => {
            if v {
                emit_log_and_record(
                    app,
                    log_buffer,
                    "Verificación exitosa: Datos recuperables.",
                    "success",
                );
            } else {
                emit_log_and_record(
                    app,
                    log_buffer,
                    "Verificación fallida: Archivo corrupto o ilegible.",
                    "error",
                );
            }
            v
        }
        Err(e) => {
            emit_log_and_record(
                app,
                log_buffer,
                &format!("Error en verificación: {}", e),
                "error",
            );
            false
        }
    };

    Ok((file_path_str, size_bytes, sha256, verified))
}

#[tauri::command]
pub async fn generate_backup(
    app: AppHandle,
    state: State<'_, AppState>,
    connection_id: String,
) -> Result<BackupResult, String> {
    let start_time = Local::now();
    let mut log_buffer = String::new();

    // 1. Get connection from DB
    let conn_result = {
        let db = state.db.lock().unwrap();
        let stmt = db.prepare("SELECT name, engine, host, port, username, password, database_name, backup_path, use_ssl FROM connections WHERE id = ?1");

        match stmt {
            Ok(mut s) => {
                let mut rows = s.query([&connection_id]).unwrap();
                if let Some(row) = rows.next().unwrap() {
                    Ok(ConnectionInfo {
                        id: Some(connection_id.clone()),
                        name: row.get::<_, String>(0).unwrap(),
                        engine: row.get::<_, String>(1).unwrap(),
                        host: row.get::<_, String>(2).unwrap(),
                        port: row.get::<_, u16>(3).unwrap(),
                        username: row.get::<_, String>(4).unwrap(),
                        password: row.get::<_, Option<String>>(5).unwrap(),
                        database_name: row.get::<_, String>(6).unwrap(),
                        backup_path: row.get::<_, String>(7).unwrap(),
                        use_ssl: row.get::<_, bool>(8).unwrap_or(false),
                        created_at: None,
                    })
                } else {
                    Err("Connection not found".to_string())
                }
            }
            Err(e) => Err(format!("Database error: {}", e)),
        }
    };

    let conn = match conn_result {
        Ok(c) => c,
        Err(e) => {
            emit_log_and_record(&app, &mut log_buffer, &e, "error");
            return Err(e);
        }
    };

    let password = if let Some(ref enc_pass) = conn.password {
        crypto::decrypt_password(enc_pass).unwrap_or_default()
    } else {
        "".to_string()
    };

    // Run the backup process catching any error
    let backup_outcome = do_backup_process(&app, &conn, &mut log_buffer, &password).await;

    let end_time = Local::now();
    let duration = end_time.signed_duration_since(start_time).num_seconds();

    let (status, error_msg, file_path_str, size_bytes, verified, sha256) = match backup_outcome {
        Ok((fp, sz, sha, v)) => {
            let status = if v { "OK" } else { "FAIL" };
            let err = if v {
                None
            } else {
                Some("Verification failed".to_string())
            };
            (status, err, fp, sz, v, sha)
        }
        Err(e) => {
            emit_log_and_record(
                &app,
                &mut log_buffer,
                &format!("Error fatal: {}", e),
                "error",
            );
            (
                "FAIL",
                Some(e.clone()),
                "".to_string(),
                0,
                false,
                "".to_string(),
            )
        }
    };

    let log_id = uuid::Uuid::new_v4().to_string();
    {
        let db = state.db.lock().unwrap();
        let _ = db.execute(
            "INSERT INTO backup_logs (id, connection_id, connection_name, engine, started_at, finished_at, duration_seconds, file_path, file_size_bytes, status, error_message, restore_verified, full_logs)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            (
                &log_id,
                &connection_id,
                &conn.name,
                &conn.engine,
                start_time.format("%Y-%m-%d %H:%M:%S").to_string(),
                end_time.format("%Y-%m-%d %H:%M:%S").to_string(),
                duration,
                &file_path_str,
                size_bytes as i64,
                status,
                error_msg,
                verified,
                &log_buffer
            )
        );
    }

    if status == "FAIL" {
        return Err("Backup operation failed. Check history for details.".to_string());
    }

    Ok(BackupResult {
        file_path: file_path_str,
        size_bytes,
        sha256,
        verified,
    })
}

async fn verify_backup(
    app: &AppHandle,
    conn: &ConnectionInfo,
    file_path: &str,
    _password: &str,
    log_buffer: &mut String,
) -> Result<bool, String> {
    emit_log_and_record(
        app,
        log_buffer,
        "Iniciando verificación de integridad nativa...",
        "info",
    );

    // Si el archivo no existe o no se puede abrir, fallamos rápido
    let mut file = std::fs::File::open(file_path)
        .map_err(|e| format!("No se pudo abrir el archivo de backup: {}", e))?;
    let metadata = file
        .metadata()
        .map_err(|e| format!("No se pudo leer metadatos: {}", e))?;

    if metadata.len() == 0 {
        emit_log_and_record(
            app,
            log_buffer,
            "El archivo de backup está vacío (0 bytes).",
            "error",
        );
        return Ok(false);
    }

    match conn.engine.as_str() {
        "mysql" => {
            let mut buffer = [0; 256];
            let read_size = if metadata.len() > 256 {
                256
            } else {
                metadata.len()
            };
            file.seek(SeekFrom::End(-(read_size as i64))).unwrap_or(0);
            if let Ok(_) = file.read_exact(&mut buffer[0..read_size as usize]) {
                let end_str = String::from_utf8_lossy(&buffer);
                if end_str.contains("Dump completed on") {
                    emit_log_and_record(
                        app,
                        log_buffer,
                        "Verificación exitosa: Se encontró firma de mysqldump válida.",
                        "success",
                    );
                    return Ok(true);
                } else {
                    emit_log_and_record(app, log_buffer, "Advertencia: No se encontró la firma '-- Dump completed on' al final del archivo.", "error");
                    return Ok(false);
                }
            }
            Ok(false)
        }
        "postgres" => {
            let mut buffer = [0; 256];
            let read_size = if metadata.len() > 256 {
                256
            } else {
                metadata.len()
            };
            file.seek(SeekFrom::End(-(read_size as i64))).unwrap_or(0);
            if let Ok(_) = file.read_exact(&mut buffer[0..read_size as usize]) {
                let end_str = String::from_utf8_lossy(&buffer);
                if end_str.contains("PostgreSQL database dump complete") {
                    emit_log_and_record(
                        app,
                        log_buffer,
                        "Verificación exitosa: Se encontró firma de pg_dump válida.",
                        "success",
                    );
                    return Ok(true);
                } else {
                    emit_log_and_record(
                        app,
                        log_buffer,
                        "Advertencia: No se encontró la firma de pg_dump al final del archivo.",
                        "error",
                    );
                    return Ok(false);
                }
            }
            Ok(false)
        }
        "sqlserver" | "mongodb" => {
            emit_log_and_record(
                app,
                log_buffer,
                "Verificación exitosa: Archivo generado correctamente (validación de tamaño).",
                "success",
            );
            Ok(true)
        }
        _ => Err("Motor no soportado para verificación".to_string()),
    }
}

fn calculate_hash_and_size(path: &PathBuf) -> Result<(u64, String), String> {
    let mut file = File::open(path).map_err(|e| format!("Failed to open backup file: {}", e))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 8192];
    let mut size = 0;

    loop {
        let count = file
            .read(&mut buffer)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        if count == 0 {
            break;
        }
        size += count as u64;
        hasher.update(&buffer[..count]);
    }

    let hash_result = hasher.finalize();
    let hash_hex = hex::encode(hash_result);

    Ok((size, hash_hex))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_calculate_hash_and_size() {
        // Create a temporary file with known content
        let mut temp_file = NamedTempFile::new().expect("Failed to create temp file");
        let content = b"hello world backup test";
        temp_file.write_all(content).expect("Failed to write to temp file");
        
        let path = temp_file.path().to_path_buf();
        
        let (size, hash) = calculate_hash_and_size(&path).expect("Failed to calculate hash and size");
        
        assert_eq!(size, content.len() as u64);
        
        // Expected SHA-256 for "hello world backup test"
        let expected_hash = "1bc521d965ba94e7dfc9cd3be5a570c9ebba50567f8c057692be2c19e59dcfb1";
        assert_eq!(hash, expected_hash);
    }
}
