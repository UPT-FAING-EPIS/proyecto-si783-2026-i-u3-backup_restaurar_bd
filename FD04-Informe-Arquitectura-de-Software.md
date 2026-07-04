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

Diagramas de Arquitectura (Ingeniería Inversa) — FD04

Versión *3.0*

| CONTROL DE VERSIONES | | | | | |
|:---:|:---|:---|:---|:---|:---|
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 1.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 20/04/2026 | Versión Original |
| 2.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 11/06/2026 | Casos de Uso y Secuencia |
| 3.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 04/07/2026 | Arquitectura C4, Paquetes, Casos de Uso ampliados |

<div style="page-break-after: always; visibility: hidden"></div>

# ÍNDICE GENERAL

- [1. Arquitectura C4](#1-arquitectura-c4)
- [2. Diagrama de Casos de Uso](#2-diagrama-de-casos-de-uso)
- [3. Diagrama de Paquetes](#3-diagrama-de-paquetes)
- [4. Diagramas de Secuencia](#4-diagramas-de-secuencia)
- [5. Diagrama de Clases / Estructuras](#5-diagrama-de-clases--estructuras)
- [6. Diagrama de Base de Datos](#6-diagrama-de-base-de-datos)
- [7. Diagrama de Componentes](#7-diagrama-de-componentes)
- [8. Diagrama de Despliegue](#8-diagrama-de-despliegue)
- [9. Diagrama de Arquitectura Clean](#9-diagrama-de-arquitectura-clean)
- [10. Diagrama de Infraestructura Terraform](#10-diagrama-de-infraestructura-terraform)

<div style="page-break-after: always; visibility: hidden"></div>

> **Nota metodológica**: Todos los diagramas han sido elaborados mediante **ingeniería inversa** del código fuente real del proyecto.

---

## 1. Arquitectura C4

### 1.1 Nivel 1 — Diagrama de Contexto

Muestra SafeBridge y sus relaciones con los actores y sistemas externos.

```mermaid
graph TB
    User["👤 Desarrollador<br/>(Usuario Final)"]
    
    SB["🖥️ SafeBridge<br/>[Aplicación de Escritorio]<br/>Orquesta backups de múltiples<br/>motores de BD con validación<br/>de integridad automática"]
    
    PG["🗄️ PostgreSQL Server<br/>[Sistema Externo]<br/>Motor de BD relacional"]
    MY["🗄️ MySQL Server<br/>[Sistema Externo]<br/>Motor de BD relacional"]
    SS["🗄️ SQL Server<br/>[Sistema Externo]<br/>Motor de BD relacional"]
    MO["🗄️ MongoDB Server<br/>[Sistema Externo]<br/>Motor de BD NoSQL"]
    FS["📁 Sistema de Archivos<br/>[Sistema Local]<br/>Almacena archivos .sql, .bak, .archive"]
    DK["🐳 Docker Desktop<br/>[Sistema Opcional]<br/>Verificación de disponibilidad"]

    User -->|"Gestiona conexiones,<br/>genera backups,<br/>consulta historial"| SB
    SB -->|"pg_dump vía TCP/IP"| PG
    SB -->|"mysqldump vía TCP/IP"| MY
    SB -->|"sqlcmd vía TDS"| SS
    SB -->|"mongodump vía TCP/IP"| MO
    SB -->|"Escribe archivos de backup<br/>y calcula SHA-256"| FS
    SB -.->|"Verifica disponibilidad<br/>(docker info)"| DK

    style SB fill:#1168bd,color:#fff
    style User fill:#08427b,color:#fff
    style PG fill:#999,color:#fff
    style MY fill:#999,color:#fff
    style SS fill:#999,color:#fff
    style MO fill:#999,color:#fff
```

### 1.2 Nivel 2 — Diagrama de Contenedores

Desglosa SafeBridge en sus contenedores tecnológicos internos.

```mermaid
graph TB
    User["👤 Desarrollador"]

    subgraph "SafeBridge Application"
        FE["📱 Frontend SPA<br/>[React 19 + Tailwind v4]<br/>UI industrial/técnica<br/>con logs en tiempo real"]
        
        BE["⚙️ Backend Nativo<br/>[Rust / Tauri v2]<br/>Lógica de negocio,<br/>orquestación de sidecars,<br/>cifrado AES-GCM"]
        
        DB["💾 Base de Datos Local<br/>[SQLite via rusqlite]<br/>safebridge.db<br/>Conexiones + Logs"]
    end

    SC["🔧 Sidecars<br/>[pg_dump, mysqldump,<br/>sqlcmd, mongodump]<br/>Binarios nativos del SO"]

    EXT["🗄️ Servidores BD Externos<br/>[PostgreSQL, MySQL,<br/>SQL Server, MongoDB]"]

    LFS["📁 File System Local<br/>Archivos de backup"]

    User -->|"Interactúa vía UI"| FE
    FE <-->|"JSON sobre IPC<br/>(invoke / emit)"| BE
    BE -->|"Lectura/Escritura<br/>rusqlite"| DB
    BE -->|"tauri_plugin_shell<br/>ejecuta procesos"| SC
    SC -->|"Descarga datos<br/>vía TCP/IP"| EXT
    SC -->|"Escribe archivos"| LFS
    BE -->|"Lee archivos para<br/>SHA-256 y EOF check"| LFS

    style FE fill:#438dd5,color:#fff
    style BE fill:#d4531c,color:#fff
    style DB fill:#003b57,color:#fff
```

### 1.3 Nivel 3 — Diagrama de Componentes del Backend

Detalla los módulos Rust internos del backend.

```mermaid
graph TB
    subgraph "Backend Rust (src-tauri/src/)"
        LIB["lib.rs<br/>[Punto de entrada]<br/>Configura plugins, estado<br/>y handler de comandos"]
        
        CONN["connections.rs<br/>[Módulo CRUD]<br/>create, list, update,<br/>delete, test_connection"]
        
        BACK["backup.rs<br/>[Orquestador]<br/>generate_backup,<br/>verify_backup,<br/>calculate_hash_and_size"]
        
        CRYP["crypto.rs<br/>[Seguridad]<br/>encrypt_password,<br/>decrypt_password<br/>AES-256-GCM"]
        
        LOGS["logs.rs<br/>[Auditoría]<br/>list_logs,<br/>get_dashboard_stats"]
        
        DBM["db.rs<br/>[Persistencia]<br/>init_db, migraciones,<br/>PRAGMA foreign_keys"]
        
        MOD["models.rs<br/>[Dominio]<br/>ConnectionInfo,<br/>BackupLog structs"]
        
        DOCK["docker.rs<br/>[Utilidad]<br/>check_docker"]
    end

    LIB --> CONN
    LIB --> BACK
    LIB --> LOGS
    LIB --> DOCK
    CONN --> CRYP
    CONN --> DBM
    BACK --> CRYP
    BACK --> DBM
    LOGS --> DBM
    CONN --> MOD
    BACK --> MOD
    LOGS --> MOD
    DBM --> MOD

    style LIB fill:#d4531c,color:#fff
    style BACK fill:#c44d17,color:#fff
    style CRYP fill:#8b0000,color:#fff
```

<div style="page-break-after: always; visibility: hidden"></div>

---

## 2. Diagrama de Casos de Uso

```mermaid
graph LR
    subgraph Actores
        U["👤 Desarrollador<br/>(Usuario)"]
        S["⚙️ Sistema SafeBridge<br/>(Rust Core)"]
    end

    subgraph "Casos de Uso"
        CU1["CU-01: Gestionar<br/>Conexiones DB"]
        CU2["CU-02: Probar<br/>Conectividad TCP"]
        CU3["CU-03: Generar Volcado<br/>Multi-Motor"]
        CU4["CU-04: Validar<br/>Integridad EOF"]
        CU5["CU-05: Consultar<br/>Dashboard"]
        CU6["CU-06: Consultar<br/>Historial"]
        INC1["Cifrar Credenciales<br/>AES-256-GCM"]
        INC2["Inyectar Credencial<br/>Temporal"]
        INC3["Emitir Logs<br/>Tiempo Real"]
        INC4["Calcular Hash<br/>SHA-256"]
    end

    U --> CU1
    U --> CU2
    U --> CU3
    U --> CU5
    U --> CU6
    S --> CU4
    S --> INC4
    CU1 -.->|"include"| INC1
    CU3 -.->|"include"| INC2
    CU3 -.->|"include"| INC3
    CU3 -.->|"extend"| CU4
    CU3 -.->|"extend"| INC4
```

<div style="page-break-after: always; visibility: hidden"></div>

---

## 3. Diagrama de Paquetes

### 3.1 Paquetes del Frontend (TypeScript/React)

```mermaid
graph TB
    subgraph "src/ (Frontend React)"
        subgraph "📦 pages/"
            D["Dashboard.tsx"]
            C["Connections.tsx"]
            B["Backup.tsx"]
            H["History.tsx"]
        end
        
        subgraph "📦 components/"
            SB["Sidebar.tsx"]
            CF["ConnectionForm.tsx"]
        end
        
        subgraph "📦 root"
            APP["App.tsx<br/>(Router principal)"]
            MAIN["main.tsx<br/>(Entry point)"]
            CSS["App.css"]
        end
    end
    
    subgraph "📦 Dependencias Externas"
        TAURI["@tauri-apps/api<br/>(core, event)"]
        DIALOG["@tauri-apps/plugin-dialog"]
        LUCIDE["lucide-react<br/>(Iconos)"]
        TOAST["react-hot-toast"]
    end

    MAIN --> APP
    APP --> SB
    APP --> D
    APP --> C
    APP --> B
    APP --> H
    C --> CF
    D --> TAURI
    B --> TAURI
    H --> TAURI
    CF --> TAURI
    CF --> DIALOG
    SB --> LUCIDE
    C --> TOAST
```

### 3.2 Paquetes del Backend (Rust/Tauri)

```mermaid
graph TB
    subgraph "src-tauri/src/ (Backend Rust)"
        subgraph "📦 Core"
            LIB["lib.rs<br/>(AppState, run())"]
            MAIN["main.rs<br/>(entry point)"]
        end
        
        subgraph "📦 Dominio"
            MOD["models.rs<br/>ConnectionInfo, BackupLog"]
        end
        
        subgraph "📦 Aplicación (Comandos Tauri)"
            CONN["connections.rs<br/>CRUD + test_connection"]
            BACK["backup.rs<br/>generate_backup"]
            LOGS["logs.rs<br/>list_logs, get_dashboard_stats"]
            DOCK["docker.rs<br/>check_docker"]
        end
        
        subgraph "📦 Infraestructura"
            DBR["db.rs<br/>init_db (SQLite)"]
            CRY["crypto.rs<br/>AES-256-GCM"]
        end
    end
    
    subgraph "📦 Crates Externos"
        TAURI_C["tauri v2"]
        SHELL["tauri-plugin-shell"]
        RSQL["rusqlite v0.40"]
        AES["aes-gcm v0.10"]
        SHA["sha2 v0.11"]
        CHR["chrono v0.4"]
        UUID["uuid v1.23"]
    end

    MAIN --> LIB
    LIB --> CONN
    LIB --> BACK
    LIB --> LOGS
    LIB --> DOCK
    CONN --> MOD
    BACK --> MOD
    LOGS --> MOD
    CONN --> DBR
    CONN --> CRY
    BACK --> DBR
    BACK --> CRY
    LOGS --> DBR
    BACK --> SHELL
    DBR --> RSQL
    CRY --> AES
    BACK --> SHA
```

<div style="page-break-after: always; visibility: hidden"></div>

---

## 4. Diagramas de Secuencia

### 4.1 Creación Segura de Conexión y Prueba de Red

```mermaid
sequenceDiagram
    actor Usuario
    participant React as UI (Connections.tsx)
    participant Tauri as Rust (connections.rs)
    participant Crypto as crypto.rs (AES-GCM)
    participant TCP as TcpStream
    participant DB as SQLite (safebridge.db)

    Usuario->>React: Completa formulario y clic "Test Connection"
    React->>Tauri: test_connection("10.0.0.5", 3306)
    Tauri->>TCP: TcpStream::connect_timeout(3s)
    alt Host responde
        TCP-->>Tauri: Ok(Stream)
        Tauri-->>React: true
        React->>Usuario: "Test Exitoso" en verde
    else Timeout
        TCP-->>Tauri: Err(Connection Refused)
        Tauri-->>React: false
        React->>Usuario: "Test Fallido" en rojo
    end

    Usuario->>React: Clic en "Guardar"
    React->>Tauri: create_connection(ConnectionInfo)
    Tauri->>Crypto: encrypt_password(password)
    Crypto-->>Tauri: encrypted_password (Base64)
    Tauri->>DB: INSERT INTO connections (...)
    DB-->>Tauri: OK
    Tauri-->>React: Ok(uuid)
    React->>Usuario: Cierra modal, actualiza lista
```

### 4.2 Flujo de Generación de Backup y Validación

```mermaid
sequenceDiagram
    actor Usuario
    participant React as Backup.tsx
    participant Tauri as backup.rs
    participant Crypto as crypto.rs
    participant Shell as Sidecar (pg_dump)
    participant FS as File System
    participant DB as SQLite

    Usuario->>React: Clic "Generar Backup" (ID: 123)
    React->>Tauri: invoke("generate_backup", {connection_id})
    Note over Tauri: Hilo asíncrono
    Tauri->>DB: SELECT FROM connections WHERE id=123
    DB-->>Tauri: ConnectionInfo (pass cifrado)
    Tauri->>Crypto: decrypt_password(encrypted)
    Crypto-->>Tauri: plain_password
    Tauri->>React: emit("backup_log", "Iniciando...")

    Tauri->>Shell: sidecar("pg_dump").env("PGPASSWORD", pass)
    Shell-->>Tauri: output (stdout/stderr)
    Tauri->>React: emit("backup_log", "Volcado generado")
    
    Tauri->>FS: calculate_hash_and_size(path)
    loop Chunks de 8KB
        FS-->>Tauri: bytes
        Tauri->>Tauri: hasher.update(bytes)
    end
    Tauri->>React: emit("backup_log", "SHA-256 calculado")

    Tauri->>FS: verify_backup() SeekFrom::End(-256)
    FS-->>Tauri: Últimos 256 bytes
    alt Firma presente
        Tauri->>React: emit("backup_log", "Verificación OK")
    else Firma ausente
        Tauri->>React: emit("backup_log", "Fallo validación")
    end

    Tauri->>DB: INSERT INTO backup_logs (...)
    Tauri-->>React: Result(BackupResult)
    React->>Usuario: Card visual OK/FAIL
```

<div style="page-break-after: always; visibility: hidden"></div>

---

## 5. Diagrama de Clases / Estructuras

```mermaid
classDiagram
    class AppState {
        <<Rust Struct>>
        +Mutex~Connection~ db
    }

    class ConnectionInfo {
        <<Rust Struct / Serde>>
        +Option~String~ id
        +String name
        +String engine
        +String host
        +u16 port
        +String username
        +Option~String~ password
        +String database_name
        +String backup_path
        +Option~String~ created_at
    }

    class BackupResult {
        <<Rust Struct / Serde>>
        +String file_path
        +u64 size_bytes
        +String sha256
        +bool verified
    }

    class BackupLogPayload {
        <<Rust Struct / Serde>>
        +String message
        +String level
    }

    class BackupLog {
        <<Rust Struct / Serde>>
        +String id
        +Option~String~ connection_id
        +String connection_name
        +String engine
        +String started_at
        +String finished_at
        +i64 duration_seconds
        +String file_path
        +i64 file_size_bytes
        +String status
        +Option~String~ error_message
        +bool restore_verified
        +Option~String~ full_logs
    }

    class DashboardStats {
        <<Rust Struct / Serde>>
        +i64 total_connections
        +i64 successful_backups
        +i64 failed_backups
        +i64 total_bytes_backed_up
        +Vec~BackupLog~ recent_activity
    }

    class BackupModule {
        <<Rust Module backup.rs>>
        +generate_backup(app, state, id) Result
        -do_backup_process(app, conn, buf, pass) Result
        -verify_backup(app, conn, path, pass, buf) Result
        -calculate_hash_and_size(path) Result
        -emit_log_and_record(app, buf, msg, level)
    }

    class CryptoModule {
        <<Rust Module crypto.rs>>
        +encrypt_password(password) Result~String~
        +decrypt_password(encrypted) Result~String~
    }

    class ConnectionsModule {
        <<Rust Module connections.rs>>
        +create_connection(state, conn) Result~String~
        +list_connections(state) Result~Vec~
        +update_connection(state, id, conn) Result
        +delete_connection(state, id) Result
        +test_connection(host, port) Result~bool~
    }

    class LogsModule {
        <<Rust Module logs.rs>>
        +list_logs(state, engine, status) Result~Vec~
        +get_dashboard_stats(state) Result~DashboardStats~
    }

    AppState --> ConnectionInfo : Gestiona
    BackupModule --> AppState : Accede
    BackupModule --> CryptoModule : decrypt_password
    ConnectionsModule --> CryptoModule : encrypt_password
    BackupModule --> BackupResult : Retorna
    BackupModule --> BackupLogPayload : Emite evento
    LogsModule --> BackupLog : Consulta
    LogsModule --> DashboardStats : Retorna
```

---

## 6. Diagrama de Base de Datos

```mermaid
erDiagram
    CONNECTIONS {
        TEXT id PK "UUID v4"
        TEXT name "Nombre amigable"
        TEXT engine "postgres|mysql|sqlserver|mongodb"
        TEXT host "IP o DNS"
        INTEGER port "Puerto"
        TEXT username "Usuario BD"
        TEXT password "Cifrada AES-256-GCM"
        TEXT database_name "Nombre BD"
        TEXT backup_path "Carpeta destino"
        DATETIME created_at "CURRENT_TIMESTAMP"
    }

    BACKUP_LOGS {
        TEXT id PK "UUID v4"
        TEXT connection_id FK "ON DELETE SET NULL"
        TEXT connection_name "Copia nombre"
        TEXT engine "Motor usado"
        DATETIME started_at "Inicio"
        DATETIME finished_at "Fin"
        INTEGER duration_seconds "Tiempo"
        TEXT file_path "Ruta absoluta"
        INTEGER file_size_bytes "Tamaño"
        TEXT status "OK|FAIL"
        TEXT error_message "Stderr"
        BOOLEAN restore_verified "EOF check"
        TEXT full_logs "Consola cruda"
    }

    CONNECTIONS ||--o{ BACKUP_LOGS : "genera (1:N)"
```

---

## 7. Diagrama de Componentes

```mermaid
graph TB
    subgraph "Frontend (Webview)"
        subgraph "React UI"
            APP["App.tsx (Router)"]
            SB["Sidebar.tsx"]
            PD["Dashboard.tsx"]
            PC["Connections.tsx"]
            PB["Backup.tsx"]
            PH["History.tsx"]
        end
        TA["@tauri-apps/api (core, event)"]
        APP --> SB
        APP --> PD
        APP --> PC
        APP --> PB
        APP --> PH
        PC --> TA
        PB --> TA
        PH --> TA
    end

    subgraph "Backend (Rust Core)"
        IPC["Tauri IPC Router (generate_handler!)"]
        MC["connections.rs"]
        MB["backup.rs"]
        ML["logs.rs"]
        MK["crypto.rs (aes-gcm)"]
        MD["db.rs (rusqlite)"]
        TA <-->|"JSON/IPC"| IPC
        IPC --> MC
        IPC --> MB
        IPC --> ML
        MC --> MK
        MB --> MK
        MC --> MD
        MB --> MD
        ML --> MD
    end

    subgraph "Sistema Operativo"
        SQLITE[("safebridge.db")]
        FSY[("File System")]
        PGD["pg_dump.exe"]
        MYD["mysqldump.exe"]
        SQC["sqlcmd.exe"]
        EDB[("Servidor BD Remoto")]
    end

    MD --> SQLITE
    MB -->|"tauri_plugin_shell"| PGD
    MB -->|"tauri_plugin_shell"| MYD
    MB -->|"tauri_plugin_shell"| SQC
    MB -->|"SHA-256, EOF"| FSY
    PGD --> EDB
```

---

## 8. Diagrama de Despliegue

```mermaid
graph LR
    subgraph "Equipo del Desarrollador"
        subgraph "SafeBridge.exe (Tauri Bundle)"
            WV["Webview2/WebKit (React UI)"]
            RB["Binario Rust (Gestión hilos)"]
            WV <-->|"IPC"| RB
        end
        subgraph "AppData"
            DBF[("safebridge.db")]
        end
        subgraph "Directorio Backups"
            BAK[("*.sql, *.bak, *.archive")]
        end
    end

    RB <-->|"R/W"| DBF
    RB -->|"Volcado"| BAK

    subgraph "Red / VPN / Nube"
        D1[("PostgreSQL :5432")]
        D2[("MySQL :3306")]
        D3[("SQL Server :1433")]
    end

    RB --> D1
    RB --> D2
    RB --> D3

    style RB fill:#d4531c,color:#fff
    style WV fill:#3776ab,color:#fff
```

---

## 9. Diagrama de Arquitectura Clean

```mermaid
graph TD
    subgraph "Presentation Layer (React/TS)"
        UI["React Router + Tailwind<br/>useState, useEffect<br/>invoke() y listen()"]
    end

    subgraph "Application Layer (Rust Commands)"
        CMD["Tauri Commands (lib.rs)<br/>generate_backup, test_connection,<br/>create_connection, list_logs"]
    end

    subgraph "Domain Layer (Rust Structs)"
        DOM["models.rs<br/>ConnectionInfo, BackupResult,<br/>BackupLog, DashboardStats"]
    end

    subgraph "Infrastructure Layer (Rust Modules)"
        INF_DB["db.rs (SQLite)"]
        INF_CR["crypto.rs (AES-GCM, SHA-256)"]
        INF_SH["backup.rs (Sidecars, FileSystem)"]
    end

    UI -->|"IPC"| CMD
    CMD --> DOM
    CMD --> INF_DB
    CMD --> INF_CR
    CMD --> INF_SH

    style UI fill:#2d5a8e,color:#fff
    style CMD fill:#5a8e2d,color:#fff
    style DOM fill:#8e6d2d,color:#fff
    style INF_DB fill:#8e2d2d,color:#fff
    style INF_CR fill:#8e2d2d,color:#fff
    style INF_SH fill:#8e2d2d,color:#fff
```

---

## 10. Diagrama de Infraestructura Terraform

> **Contexto:** Infraestructura teórica AWS para futuras versiones.

```mermaid
graph TD
    subgraph "Entorno Local"
        SB["SafeBridge v2.0 (Tauri + AWS SDK)"]
        BAK["Archivo Local .sql"]
        SB --> BAK
    end

    subgraph "AWS (Terraform)"
        S3["Amazon S3<br/>safebridge-secure-backups"]
        LAMBDA["AWS Lambda<br/>(Orquestador Validación)"]
        RDS["Amazon RDS<br/>(db.t4g.micro efímera)"]
        DDB["Amazon DynamoDB<br/>(Registro Validación)"]
    end

    SB -->|"1. PutObject"| S3
    S3 -->|"2. s3:ObjectCreated"| LAMBDA
    LAMBDA -->|"3. Restaura"| RDS
    LAMBDA -->|"4. Verifica y destruye"| RDS
    LAMBDA -->|"5. Guarda resultado"| DDB
    SB -.->|"6. Consulta estado"| DDB

    style S3 fill:#7aa116,color:#fff
    style LAMBDA fill:#ff9900,color:#000
    style RDS fill:#336699,color:#fff
    style DDB fill:#336699,color:#fff
```

---

*Documento actualizado por el equipo BitCraft Solutions — Universidad Privada de Tacna, FAING-EPIS, Ciclo 2026-I.*
