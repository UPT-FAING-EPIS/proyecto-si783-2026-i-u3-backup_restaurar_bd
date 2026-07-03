<center>

![./media/logo-upt.png](./media/logo-upt.png)

**UNIVERSIDAD PRIVADA DE TACNA**

**FACULTAD DE INGENIERÍA**

**Escuela Profesional de Ingeniería de Sistemas**

**Proyecto: *SafeBridge: Ecosistema Multi-Motor de Respaldos y Validación de Integridad***

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

Diagramas de Arquitectura — FD04

Versión *3.0*

| CONTROL DE VERSIONES | | | | | |
|:---:|:---|:---|:---|:---|:---|
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 2.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 31/05/2026 | Actualización para Tauri/Rust Architecture |
| 3.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 03/07/2026 | Actualización a Ecosistema (FastAPI, Action, VSCode) |

<div style="page-break-after: always; visibility: hidden"></div>

# ÍNDICE GENERAL

- [1. Diagrama de Arquitectura Global (Ecosistema)](#1-diagrama-de-arquitectura-global-ecosistema)
- [2. Diagrama de Clases (Patrón Estrategia - FastAPI)](#2-diagrama-de-clases-patrón-estrategia---fastapi)
- [3. Diagrama de Despliegue (Docker Compose)](#3-diagrama-de-despliegue-docker-compose)
- [4. Arquitectura de GitHub Action](#4-arquitectura-de-github-action)

<div style="page-break-after: always; visibility: hidden"></div>

---

## 1. Diagrama de Arquitectura Global (Ecosistema)

SafeBridge ahora opera como una arquitectura distribuida (ecosistema de herramientas).

```mermaid
graph TD
    subgraph "IDE del Desarrollador"
        VSCODE["VS Code Extension\n(TypeScript/Node.js)"]
        BAK_LOCAL[("Archivos Locales\n(.sql, .bak)")]
        VSCODE -->|"Valida (EOF)"| BAK_LOCAL
    end

    subgraph "CI/CD Pipeline (GitHub)"
        GHACTION["SafeBridge Action\n(Python)"]
        DOCKER_TMP["Contenedor Docker\n(SQL Server Temporal)"]
        GHACTION -->|"Levanta y prueba"| DOCKER_TMP
    end

    subgraph "Nube / VPS (Docker Compose)"
        BOT["Telegram Bot Worker\n(Python)"]
        API["FastAPI Core\n(Python 3.11)"]
        BOT <-->|"Llamadas REST"| API
    end

    subgraph "Motores Remotos"
        DB1[(PostgreSQL)]
        DB2[(MySQL)]
        API -->|"mysqldump / pg_dump"| DB1
        API -->|"mysqldump / pg_dump"| DB2
    end
    
    USER((Usuario)) -->|"Habla con Bot"| BOT
    USER -->|"Usa comando"| VSCODE
    USER -->|"Git Push"| GHACTION
```

---

## 2. Diagrama de Clases (Patrón Estrategia - FastAPI)

La lógica core de respaldo se apoya fuertemente en el **Strategy Pattern**, lo cual respeta el Principio Abierto/Cerrado (OCP) de SOLID.

```mermaid
classDiagram
    class BackupService {
        +generar_backup(request: BackupRequest) FileResponse
    }

    class BaseEngine {
        <<Abstract>>
        +execute_backup(req) str
        +verify_backup(file_path) bool
    }

    class PostgresEngine {
        +execute_backup(req) str
        +verify_backup(file_path) bool
    }

    class MySQLEngine {
        +execute_backup(req) str
        +verify_backup(file_path) bool
    }

    class SqlServerEngine {
        +execute_backup(req) str
        +verify_backup(file_path) bool
    }

    class MongoEngine {
        +execute_backup(req) str
        +verify_backup(file_path) bool
    }

    BackupService --> BaseEngine : usa (Strategy)
    BaseEngine <|-- PostgresEngine
    BaseEngine <|-- MySQLEngine
    BaseEngine <|-- SqlServerEngine
    BaseEngine <|-- MongoEngine
```

---

## 3. Diagrama de Despliegue (Docker Compose)

El backend principal se despliega de forma muy sencilla en VPS mediante un archivo `docker-compose.yml`.

```mermaid
graph LR
    subgraph "VPS Server (Linux)"
        subgraph "Docker Compose Network"
            CONTAINER_API["Contenedor: api (FastAPI)\n- Expone puerto 8000\n- Incluye pg_dump, sqlcmd instalados"]
            CONTAINER_BOT["Contenedor: bot (Telegram Worker)\n- Polling a Telegram"]
        end
    end

    TELEGRAM_API((Telegram\nCloud Servers)) <-->|"Long Polling / Webhook"| CONTAINER_BOT
    CONTAINER_BOT <-->|"HTTP GET/POST (Red Interna)"| CONTAINER_API
```

---

## 4. Arquitectura de GitHub Action

La arquitectura de validación dentro de integración continua aprovecha la capacidad de Python para orquestar contenedores Docker (`subprocess`) al interior del Runner de GitHub.

```mermaid
sequenceDiagram
    participant GH as GitHub Runner
    participant Action as safebridge-action (Python)
    participant Docker as Docker Engine
    
    GH->>Action: Ejecuta verify_backup.py
    Action->>Action: Detecta archivo 'mi_backup.bak'
    Action->>Docker: docker run -d mcr.microsoft.com/mssql/server:2022
    Docker-->>Action: Contenedor Activo
    Action->>Docker: docker exec sqlcmd -Q "RESTORE VERIFYONLY FROM DISK..."
    Docker-->>Action: Salida (Éxito o Falla)
    Action->>Docker: docker rm -f (Limpia entorno)
    Action-->>GH: Exit 0 (Success) o Exit 1 (Fail)
```
