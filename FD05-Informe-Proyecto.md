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

Documentación Técnica (DocFX) y Manual de Usuario — FD05

Versión *2.0*

| CONTROL DE VERSIONES | | | | | |
|:---:|:---|:---|:---|:---|:---|
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 1.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 11/06/2026 | Versión Original |
| 2.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 04/07/2026 | Revisión completa con API ampliada |

<div style="page-break-after: always; visibility: hidden"></div>

# ÍNDICE GENERAL

- [1. Documentación Técnica de la API](#1-documentación-técnica-de-la-api)
  - [1.1. Módulo: crypto.rs](#11-módulo-cryptors)
  - [1.2. Módulo: backup.rs](#12-módulo-backuprs)
  - [1.3. Módulo: connections.rs](#13-módulo-connectionsrs)
  - [1.4. Módulo: logs.rs](#14-módulo-logsrs)
  - [1.5. Módulo: db.rs](#15-módulo-dbrs)
  - [1.6. Módulo: docker.rs](#16-módulo-dockerrs)
- [2. Manual de Usuario](#2-manual-de-usuario)
  - [2.1. Panel Principal (Dashboard)](#21-panel-principal-dashboard)
  - [2.2. Gestión de Conexiones](#22-gestión-de-conexiones)
  - [2.3. Generación de Respaldos](#23-generación-de-respaldos)
  - [2.4. Historial y Auditoría](#24-historial-y-auditoría)
- [3. Estructura del Proyecto](#3-estructura-del-proyecto)
- [4. Dependencias del Proyecto](#4-dependencias-del-proyecto)

<div style="page-break-after: always; visibility: hidden"></div>

---

## 1. Documentación Técnica de la API

### 1.1. Módulo: `crypto.rs`

Provee utilidades criptográficas para asegurar las credenciales en almacenamiento local.

#### `encrypt_password(password: &str) -> Result<String, String>`
Cifra una contraseña usando AES-256-GCM con nonce aleatorio de 12 bytes.

- **Entrada:** `password` — Contraseña en texto plano.
- **Salida:** Cadena Base64 que contiene `nonce (12 bytes) + ciphertext`.
- **Error:** Si el cifrado falla internamente.

#### `decrypt_password(encrypted: &str) -> Result<String, String>`
Descifra una contraseña previamente cifrada.

- **Entrada:** `encrypted` — Cadena Base64 de nonce+ciphertext.
- **Salida:** Contraseña en texto plano.
- **Error:** Si la longitud es < 12 bytes o el descifrado falla.

---

### 1.2. Módulo: `backup.rs`

Orquestador principal de subprocesos y analizador de archivos.

#### `generate_backup(app, state, connection_id) -> Result<BackupResult, String>`
Comando Tauri principal. Orquesta todo el ciclo de backup.

- **Flujo:** Consulta conexión → Descifra password → Ejecuta sidecar → Calcula SHA-256 → Verifica EOF → Inserta log.
- **Retorna:** `BackupResult { file_path, size_bytes, sha256, verified }`.

#### `verify_backup(app, conn, file_path, password, log_buffer) -> Result<bool, String>`
Lee los últimos 256 bytes del archivo para buscar firmas de finalización.

- **MySQL:** Busca `"Dump completed on"`.
- **PostgreSQL:** Busca `"PostgreSQL database dump complete"`.
- **SQL Server / MongoDB:** Valida que tamaño > 0.

#### `calculate_hash_and_size(path) -> Result<(u64, String), String>`
Calcula SHA-256 por chunks de 8KB sin cargar el archivo completo en RAM.

- **Retorna:** Tupla `(size_bytes, sha256_hex_string)`.

---

### 1.3. Módulo: `connections.rs`

CRUD de conexiones con cifrado integrado.

#### `create_connection(state, conn) -> Result<String, String>`
Genera UUID v4, cifra la contraseña e inserta en SQLite. Retorna el UUID.

#### `list_connections(state) -> Result<Vec<ConnectionInfo>, String>`
Lista todas las conexiones. **El campo `password` siempre es `None`** (no se envía al frontend).

#### `update_connection(state, id, conn) -> Result<(), String>`
Actualiza una conexión. Si se envía contraseña no vacía, se re-cifra. Si está vacía, se mantiene la anterior.

#### `delete_connection(state, id) -> Result<(), String>`
Elimina la conexión. Los logs asociados mantienen `connection_id = NULL` por ON DELETE SET NULL.

#### `test_connection(host, port) -> Result<bool, String>`
Abre un socket TCP con timeout de 3 segundos usando `TcpStream::connect_timeout`.

---

### 1.4. Módulo: `logs.rs`

#### `list_logs(state, engine, status) -> Result<Vec<BackupLog>, String>`
Lista logs con filtros opcionales por motor y estado. Ignora filtros si son `"all"` o vacíos.

#### `get_dashboard_stats(state) -> Result<DashboardStats, String>`
Retorna estadísticas agregadas: total conexiones, backups OK, backups FAIL, bytes totales y últimos 5 logs.

---

### 1.5. Módulo: `db.rs`

#### `init_db(app_dir) -> Result<Connection>`
Crea el directorio de la app si no existe, abre/crea `safebridge.db`, habilita `PRAGMA foreign_keys = ON`, crea tablas `connections` y `backup_logs`, y aplica migraciones incrementales.

---

### 1.6. Módulo: `docker.rs`

#### `check_docker() -> bool`
Ejecuta `docker info` y retorna `true` si Docker está disponible.

<div style="page-break-after: always; visibility: hidden"></div>

---

## 2. Manual de Usuario

### 2.1. Panel Principal (Dashboard)

El **Dashboard** es la pantalla inicial. Provee un vistazo rápido a la salud de sus respaldos.

- **4 Tarjetas KPI:** Total Conexiones, Backups Exitosos, Backups Fallidos, Datos Resguardados.
- **Actividad Reciente:** Últimos 5 backups con estado, motor, fecha y tamaño.
- Si un backup ha fallado, la tarjeta se ilumina en rojo.

### 2.2. Gestión de Conexiones

1. Navegue a **Conexiones** en el panel lateral.
2. Clic en **"Nueva Conexión"**.
3. Seleccione motor (PostgreSQL, MySQL, SQL Server, MongoDB). El puerto se ajusta automáticamente.
4. Ingrese Host, Puerto, Usuario, Contraseña, Nombre de BD.
5. Seleccione la carpeta destino con el botón de carpeta (diálogo nativo del SO).
6. Presione **Test Connection** para verificar conectividad TCP.
7. Presione **Guardar**. La contraseña se cifra con AES-256-GCM automáticamente.

### 2.3. Generación de Respaldos

1. Diríjase a **Generar Backup**.
2. Seleccione la conexión del dropdown.
3. Pulse **Iniciar Backup**.
4. **Terminal en Vivo:** Observe el avance en tiempo real con mensajes de info (gris), éxito (verde) y error (rojo).
5. **Barra de progreso:** Muestra la fase actual.
6. Al concluir, un card indica BACKUP VERIFICADO (verde) u OPERACIÓN FALLIDA (rojo).

### 2.4. Historial y Auditoría

1. Navegue a **Historial**.
2. Use los filtros de Motor y Estado para refinar resultados.
3. Use la barra de búsqueda para encontrar por nombre de conexión.
4. Clic en cualquier fila para ver el detalle completo:
   - ID de operación, Estado, Conexión, Motor
   - Tiempos de inicio/fin, Ruta del archivo, Tamaño
   - Verificación EOF (Exitosa/Fallida)
   - Mensajes de error (si los hay)
   - Logs crudos de ejecución (expandible)

<div style="page-break-after: always; visibility: hidden"></div>

---

## 3. Estructura del Proyecto

```
proyecto-si783-2026-i-u2-backup-restaurar-bd/
├── index.html                    # Entry HTML para Vite
├── package.json                  # Dependencias Node.js
├── vite.config.ts                # Configuración Vite + Tauri
├── tsconfig.json                 # TypeScript config
├── src/                          # Frontend React
│   ├── main.tsx                  # Punto de entrada React
│   ├── App.tsx                   # Router principal
│   ├── App.css                   # Estilos globales
│   ├── components/
│   │   ├── Sidebar.tsx           # Navegación lateral
│   │   └── ConnectionForm.tsx    # Formulario de conexiones
│   └── pages/
│       ├── Dashboard.tsx         # KPIs y actividad reciente
│       ├── Connections.tsx       # CRUD de conexiones
│       ├── Backup.tsx            # Orquestador con terminal
│       └── History.tsx           # Historial filtrable
├── src-tauri/                    # Backend Rust
│   ├── Cargo.toml                # Dependencias Rust
│   ├── tauri.conf.json           # Configuración Tauri
│   └── src/
│       ├── main.rs               # Entry point Rust
│       ├── lib.rs                # AppState, plugins, handlers
│       ├── models.rs             # Structs: ConnectionInfo, BackupLog
│       ├── db.rs                 # Inicialización SQLite
│       ├── crypto.rs             # AES-256-GCM encrypt/decrypt
│       ├── connections.rs        # CRUD + test TCP
│       ├── backup.rs             # Orquestador + EOF + SHA-256
│       ├── logs.rs               # Consultas de auditoría
│       └── docker.rs             # Verificación Docker
```

---

## 4. Dependencias del Proyecto

### Frontend (Node.js)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| react | ^19.1.0 | Framework UI |
| react-dom | ^19.1.0 | Renderizado DOM |
| @tauri-apps/api | ^2 | Comunicación IPC con Rust |
| @tauri-apps/plugin-dialog | ^2.7.1 | Diálogos nativos del SO |
| lucide-react | ^1.17.0 | Librería de iconos |
| react-hot-toast | ^2.6.0 | Notificaciones toast |
| tailwindcss | ^4.3.0 | Framework CSS |
| typescript | ~5.8.3 | Tipado estático |
| vite | ^7.0.4 | Bundler/Dev server |

### Backend (Rust)

| Crate | Versión | Propósito |
|-------|---------|-----------|
| tauri | 2 | Framework desktop |
| tauri-plugin-shell | 2 | Ejecución de sidecars |
| tauri-plugin-dialog | 2.7.1 | Diálogos nativos |
| rusqlite | 0.40.0 | SQLite embebido |
| aes-gcm | 0.10.3 | Cifrado AES-256-GCM |
| sha2 | 0.11.0 | Hash SHA-256 |
| uuid | 1.23.2 | Generación UUID v4 |
| chrono | 0.4.44 | Manejo de fechas/hora |
| serde | 1 | Serialización JSON |
| base64 | 0.22.1 | Codificación Base64 |
| rand | 0.10.1 | Generación de nonces aleatorios |
| hex | 0.4.3 | Codificación hexadecimal |

---

*Documento actualizado por el equipo BitCraft Solutions — Universidad Privada de Tacna, FAING-EPIS, Ciclo 2026-I.*
