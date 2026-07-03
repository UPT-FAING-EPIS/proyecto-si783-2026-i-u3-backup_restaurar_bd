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

**Empresa / Equipo: BitCraft Solutions**

**Tacna – Perú**

***2026***

</center>

<div style="page-break-after: always; visibility: hidden"></div>

**Sistema: *SafeBridge: Ecosistema Multi-Motor de Respaldos y Validación de Integridad***

**Informe FD02 — Roadmap, Características y Gestión del Producto**

**Versión *3.0***

| CONTROL DE VERSIONES | | | | | |
|:---:|---|---|---|---|---|
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 2.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 31/05/2026 | Actualización de Características (Tauri) |
| 3.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 03/07/2026 | Evolución a Ecosistema DevOps (Telegram, GitHub, VSCode) |

<div style="page-break-after: always; visibility: hidden"></div>

---

# ÍNDICE GENERAL

1. [Descripción General del Producto](#1-descripción-general-del-producto)
2. [Características Actuales del Producto (Ecosistema)](#2-características-actuales-del-producto-ecosistema)
   - [2.1 SafeBridge Telegram API (FastAPI)](#21-safebridge-telegram-api-fastapi)
   - [2.2 SafeBridge Action (GitHub)](#22-safebridge-action-github)
   - [2.3 SafeBridge VS Code Extension](#23-safebridge-vs-code-extension)
3. [Roadmap y Futuras Versiones](#3-roadmap-y-futuras-versiones)
4. [Gestión de Tareas con GitHub Projects y Ramas](#4-gestión-de-tareas-con-github-projects-y-ramas)
5. [Conclusiones](#5-conclusiones)

<div style="page-break-after: always; visibility: hidden"></div>

---

## 1. Descripción General del Producto

**SafeBridge** ha evolucionado de ser una aplicación local (Desktop) a un ecosistema DevOps completo diseñado para garantizar la integridad de respaldos de bases de datos en cualquier punto del ciclo de vida del software.

El producto ahora se divide en tres componentes clave, cada uno atacando un problema específico del desarrollador: la necesidad de solicitar respaldos de forma remota, la necesidad de verificar backups durante la integración continua, y la necesidad de validar archivos grandes localmente sin salir del editor de código.

<div style="page-break-after: always; visibility: hidden"></div>

---

## 2. Características Actuales del Producto (Ecosistema)

### 2.1 SafeBridge Telegram API (FastAPI)

Un microservicio central escrito en **Python (FastAPI)** bajo principios de Clean Architecture.
- **Orquestación Asíncrona:** Ejecuta `mysqldump`, `pg_dump`, `sqlcmd` o `mongodump` usando el Patrón Estrategia (`Strategy Pattern`).
- **Bot de Telegram:** Los usuarios autenticados pueden interactuar con un bot de Telegram, solicitar volcados, y recibir el archivo resultante (.sql o .bak) directamente en el chat junto con un reporte de logs generados en el servidor.
- **Despliegue Contenerizado:** Emplea Docker Compose para levantar en paralelo la API interna y el worker del Bot de Telegram en un VPS.

### 2.2 SafeBridge Action (GitHub)

Una **Custom GitHub Action** que automatiza la validación de integridad.
- **Detección Automática:** Encuentra archivos `.sql`, `.bak`, `.bson` en los commits y ramas empujadas.
- **Validación Binaria:** Para SQL Server (.bak), levanta inteligentemente un contenedor Docker efímero con SQL Server 2022 y ejecuta `RESTORE VERIFYONLY` para validación profunda, apagándolo y destruyéndolo tras confirmar el estado.
- **Validación Rápida:** Para PostgreSQL y MySQL, revisa firmas como `Dump completed on` en milisegundos.

### 2.3 SafeBridge VS Code Extension

Extensión para el IDE más popular del mundo, desarrollada en **TypeScript y Node.js**.
- **Comandos Integrados:** Mediante `Ctrl + Shift + P` -> `SafeBridge: Verificar integridad de Backup`.
- **Análisis Local Inteligente:** Provee al desarrollador retroalimentación inmediata (OK / Corrupto) de un backup descargado o generado, sin depender de subidas a la nube ni scripts adicionales.

<div style="page-break-after: always; visibility: hidden"></div>

---

## 3. Roadmap y Futuras Versiones

| Versión | Release Date (estimado) | Estado | Características Principales |
|:-------:|:----------------------:|:------:|------------------------------|
| **v2.0** | Mayo 2026 | ✅ Liberada | Versión Tauri MVP (Descontinuada a favor del ecosistema distribuido). |
| **v3.0** | Julio 2026 | ✅ Liberada | Ecosistema DevOps: API FastAPI, Bot de Telegram conversacional, GitHub Action de verificación CI/CD, VS Code Extension. |
| **v3.5** | Octubre 2026 | 📋 Planificada | Integrar envío automático de los respaldos orquestados por el Telegram Bot hacia AWS S3 de forma nativa (Boto3). |

<div style="page-break-after: always; visibility: hidden"></div>

---

## 4. Gestión de Tareas con GitHub Projects y Ramas

Con la transición a ecosistema, ahora manejamos un repositorio Monorepo o múltiples repositorios conectados (`safebridge-telegram`, `safebridge-action`, `safebridge-vscode`).

**Estrategia de Ramas:**
- `main`: Código estable para producción.
- `feat/bot-webhook`: Tareas para el Bot de Telegram.
- `feat/action-docker`: Tareas para la GitHub Action.
- `bugfix/vscode-regex`: Reparación de la extensión.

Los PRs (Pull Requests) exigen revisión y validación mediante las mismas GitHub Actions generadas por el equipo para hacer "dogfooding" (probar la herramienta en los propios respaldos de la herramienta).

<div style="page-break-after: always; visibility: hidden"></div>

---

## 5. Conclusiones

La transformación de un producto monolítico a un **Ecosistema Modular (Microservicios + Extensiones)** asegura que SafeBridge se alinee con las demandas modernas de las empresas tecnológicas: integración en los IDEs (VS Code), validación continua (GitHub Actions), y gestión remota notificada (Telegram + FastAPI). 

---

*Documento generado por el equipo BitCraft Solutions — Universidad Privada de Tacna, 2026.*
