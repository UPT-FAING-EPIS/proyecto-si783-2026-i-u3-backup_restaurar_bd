<center>

![./media/logo-upt.png](./media/logo-upt.png)

**UNIVERSIDAD PRIVADA DE TACNA**

**FACULTAD DE INGENIERÍA**

**Escuela Profesional de Ingeniería de Sistemas**

**Proyecto: *SafeBridge: Orquestador Multi-Motor de Respaldos y Validación de Integridad***

Curso: *Base de Datos II*

Docente: *Ing. Patrick José Cuadros Quiroga*

Integrantes:

***Sierra Ruiz, Iker Alberto (2023077090)***

***Cortez Mamani, Julio Samuel (2023077283)***

**Tacna – Perú**

***2026***

</center>

<div style="page-break-after: always; visibility: hidden"></div>

Sistema *SafeBridge*

Diccionario de Datos — Base de Datos Local (SQLite)

Versión *2.0*

| CONTROL DE VERSIONES | | | | | |
|:---:|:---|:---|:---|:---|:---|
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 1.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 11/06/2026 | Versión Original |
| 2.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 04/07/2026 | Revisión completa con campo sha256_hash y validación de código |

<div style="page-break-after: always; visibility: hidden"></div>

# ÍNDICE GENERAL

- [1. Descripción General](#1-descripción-general)
- [2. Tabla: connections](#2-tabla-connections)
- [3. Tabla: backup_logs](#3-tabla-backup_logs)
- [4. Relaciones (Constraints)](#4-relaciones-constraints)
- [5. Script SQL de Creación](#5-script-sql-de-creación)

<div style="page-break-after: always; visibility: hidden"></div>

---

## 1. Descripción General

La aplicación SafeBridge opera bajo una arquitectura *Local First*, almacenando toda la información de manera persistente en una base de datos **SQLite** ubicada en la carpeta local de la aplicación del usuario (`%APPDATA%/safebridge/safebridge.db` o `~/.config/safebridge/safebridge.db`). 

El esquema consta de dos tablas fundamentales: `connections` (para guardar credenciales cifradas) y `backup_logs` (auditoría de cada volcado).

**Configuración de la base de datos:**
- `PRAGMA foreign_keys = ON` — Habilitado al inicio para integridad referencial.
- Migración incremental: se intenta `ALTER TABLE` para agregar columnas nuevas si la tabla ya existía.

---

## 2. Tabla: `connections`

**Propósito:** Almacena la información necesaria para establecer la conectividad con diferentes motores de bases de datos.  
**Clave Primaria:** `id`

| Nombre del Campo | Tipo de Dato (SQLite) | Nulo | Descripción / Reglas |
|:-----------------|:----------------------|:-----|:---------------------|
| `id` | `TEXT` | No | UUID v4 único generado en Rust (`uuid::Uuid::new_v4()`). PRIMARY KEY. |
| `name` | `TEXT` | No | Nombre amigable ingresado por el usuario (ej: "Producción AWS"). |
| `engine` | `TEXT` | No | Motor de base de datos. Valores aceptados: `postgres`, `mysql`, `sqlserver`, `mongodb`. |
| `host` | `TEXT` | No | Dirección IP local, remota o dominio. |
| `port` | `INTEGER` | No | Puerto numérico (ej: 5432, 3306, 1433, 27017). Rango válido: 1-65535. |
| `username` | `TEXT` | No | Nombre del usuario administrativo o con privilegios de volcado. |
| `password` | `TEXT` | No | Contraseña cifrada con AES-256-GCM. Formato: Base64(nonce_12bytes + ciphertext). **Nunca en texto plano.** |
| `database_name` | `TEXT` | No | Nombre lógico de la base de datos a respaldar. |
| `backup_path` | `TEXT` | No | Ruta absoluta del sistema de archivos local hacia donde se enviará el archivo. |
| `created_at` | `DATETIME` | No | Marca de tiempo por defecto (`CURRENT_TIMESTAMP`). |

---

## 3. Tabla: `backup_logs`

**Propósito:** Registro de auditoría inmutable de todas las operaciones de orquestación, sus estados, y los resultados de las comprobaciones de integridad (EOF y Hash).  
**Clave Primaria:** `id`

| Nombre del Campo | Tipo de Dato (SQLite) | Nulo | Descripción / Reglas |
|:-----------------|:----------------------|:-----|:---------------------|
| `id` | `TEXT` | No | UUID v4 único generado en Rust por cada intento de respaldo. |
| `connection_id` | `TEXT` | Sí | FK hacia `connections(id)`. Puede ser `NULL` si la conexión fue eliminada (ON DELETE SET NULL). |
| `connection_name` | `TEXT` | No | Copia en duro del nombre de la conexión al momento de la ejecución. |
| `engine` | `TEXT` | No | Copia en duro del motor usado (postgres/mysql/sqlserver/mongodb). |
| `started_at` | `DATETIME` | No | Momento en que el proceso de volcado inicia. Formato: `YYYY-MM-DD HH:MM:SS`. |
| `finished_at` | `DATETIME` | No | Momento en que el volcado y la verificación terminan. |
| `duration_seconds` | `INTEGER` | No | Tiempo total transcurrido en segundos. |
| `file_path` | `TEXT` | No | Ruta completa del archivo generado (`.sql`, `.bak`, `.archive`). |
| `file_size_bytes` | `INTEGER` | No | Peso exacto en disco en bytes. |
| `status` | `TEXT` | No | Estado de finalización. Valores: `OK`, `FAIL`. |
| `error_message` | `TEXT` | Sí | Extracto del `stderr` del motor de base de datos si falló. |
| `restore_verified` | `BOOLEAN` | No | `1` si la firma final de EOF fue exitosa; `0` si el archivo falló validación. |
| `full_logs` | `TEXT` | Sí | Consola cruda generada por Rust durante todo el proceso. Formato: `[HH:MM:SS] [LEVEL] message`. |

---

## 4. Relaciones (Constraints)

- **FK_Backup_Connection**: El campo `backup_logs.connection_id` posee una restricción de clave foránea `REFERENCES connections(id) ON DELETE SET NULL`. Esto asegura que si el usuario elimina un servidor de la lista, los registros de auditoría de backups pasados se mantienen intactos con `connection_id = NULL`.

- **PRAGMA foreign_keys = ON**: Habilitado explícitamente en `db.rs` al inicializar la conexión SQLite para garantizar la integridad referencial.

---

## 5. Script SQL de Creación

Extraído directamente de `src-tauri/src/db.rs`:

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS connections (
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
);

CREATE TABLE IF NOT EXISTS backup_logs (
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
);

-- Migración incremental
ALTER TABLE backup_logs ADD COLUMN full_logs TEXT;
```

---

*Documento actualizado por el equipo BitCraft Solutions — Universidad Privada de Tacna, FAING-EPIS, Ciclo 2026-I.*
