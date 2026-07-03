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

**Sistema: *SafeBridge: Ecosistema Multi-Motor de Respaldos y Validación de Integridad***

**Informe de Factibilidad**

**Versión *3.0***

| CONTROL DE VERSIONES | | | | | |
|:---:|---|---|---|---|---|
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 1.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 27/03/2026 | Versión Original |
| 2.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 31/05/2026 | Actualización Arquitectura a Tauri/Rust |
| 3.0 | IASR / JSCM | Ing. P. Cuadros | Ing. P. Cuadros | 03/07/2026 | Evolución a Ecosistema (Telegram, VSCode, GH Action) |

<div style="page-break-after: always; visibility: hidden"></div>

---

# ÍNDICE GENERAL

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Riesgos](#2-riesgos)
3. [Análisis de la Situación Actual](#3-análisis-de-la-situación-actual)
4. [Estudio de Factibilidad](#4-estudio-de-factibilidad)
   - [4.1 Factibilidad Técnica](#41-factibilidad-técnica)
   - [4.2 Factibilidad Económica](#42-factibilidad-económica)
   - [4.3 Factibilidad Operativa](#43-factibilidad-operativa)
   - [4.4 Factibilidad Legal](#44-factibilidad-legal)
   - [4.5 Factibilidad Social y Ambiental](#45-factibilidad-social-y-ambiental)
5. [Análisis Financiero](#5-análisis-financiero)
6. [Conclusiones](#6-conclusiones)

<div style="page-break-after: always; visibility: hidden"></div>

---

## 1. Descripción del Proyecto

### 1.1 Nombre del proyecto

**SafeBridge: Ecosistema Multi-Motor de Respaldos y Validación de Integridad**

### 1.2 Duración del proyecto

Cuatro (4) meses, equivalentes a un ciclo académico universitario (marzo – julio 2026). El análisis de factibilidad económica se proyecta a un horizonte de un (1) año con el fin de evaluar el retorno de la inversión.

### 1.3 Descripción

En la actualidad, la pérdida de datos representa uno de los principales riesgos operativos para los desarrolladores. Disponer de un archivo de respaldo no garantiza por sí solo que dicho respaldo sea utilizable en una emergencia. 

Ante esta problemática, surge la evolución de **SafeBridge**, pasando de ser una aplicación monolítica de escritorio a un ecosistema de herramientas desacopladas orientadas a desarrolladores individuales, DevSecOps y pequeñas empresas. El ecosistema consta de:
- **(i) SafeBridge Telegram API (FastAPI/Python):** Un microservicio core diseñado bajo Clean Architecture que ejecuta operaciones de orquestación y respaldo empleando el Patrón Estrategia para `pg_dump`, `mysqldump`, `sqlcmd` y `mongodump`. Se comunica con el usuario a través de un Bot de Telegram.
- **(ii) SafeBridge Action:** Una Custom GitHub Action que verifica automáticamente la integridad de los volcados (.sql, .bak, .bson, .archive) en entornos de integración continua (CI/CD).
- **(iii) SafeBridge VS Code Extension:** Una extensión nativa construida en TypeScript/Node.js que permite validar backups locales en milisegundos usando validación EOF.

### 1.4 Objetivos

#### 1.4.1 Objetivo General

Desarrollar un ecosistema de software modular y multiplataforma que automatice la generación de respaldos y la validación de integridad para múltiples motores de bases de datos, integrándose en las herramientas diarias del desarrollador (Telegram, GitHub y VS Code).

#### 1.4.2 Objetivos Específicos

- Desacoplar la lógica monolítica previa creando una API REST en Python (FastAPI) para orquestación de bases de datos.
- Implementar un bot de Telegram como interfaz conversacional principal para desencadenar respaldos y recibir los archivos de forma asíncrona.
- Desarrollar una extensión nativa para VS Code que valide la integridad de archivos (EOF y peso) directamente en el editor.
- Integrar la validación inteligente en flujos CI/CD mediante una GitHub Action que levante contenedores efímeros (ej. SQL Server) cuando se requiera validación profunda.
- Desplegar el backend (FastAPI y Bot) mediante Docker Compose en un VPS.

<div style="page-break-after: always; visibility: hidden"></div>

---

## 2. Riesgos

A continuación se identifican los principales riesgos que podrían afectar el éxito del proyecto:

| Categoría | Riesgo | Probabilidad | Estrategia de Mitigación |
|-----------|--------|:------------:|--------------------------|
| Técnico | Incompatibilidad de binarios en contenedor Docker (FastAPI) | Media | Instalar clientes explícitos en el `Dockerfile` (`postgresql-client`, `mssql-tools18`). |
| Seguridad | Exposición de variables de entorno (Token del Bot Telegram) | Baja | Usar `.env` estrictamente y excluir del control de versiones. Gestión mediante `pydantic-settings`. |
| Operativo | Archivos demasiado grandes para la red de Telegram (Límite 50MB) | Media | Implementar envío en chunks o proveer enlaces de descarga seguros si el archivo supera el límite de la API de Telegram. |
| Técnico | Fallo al levantar contenedor de SQL Server en GitHub Actions | Baja | Optimizar el script de la acción y aumentar timeout para la creación del Docker temporal. |

<div style="page-break-after: always; visibility: hidden"></div>

---

## 3. Análisis de la Situación Actual

### 3.1 Planteamiento del Problema

Anteriormente, la generación y validación requerían instalar una aplicación de escritorio que consumía recursos en la máquina del cliente y ataba la solución a un único entorno local. Los flujos de desarrollo modernos exigen validaciones integradas en CI/CD y operaciones manejables remotamente sin instalar interfaces gráficas.

### 3.2 Consideraciones de Hardware y Software

| Tipo | Componente | Especificaciones | Estado |
|------|------------|-----------------|--------|
| SOFTWARE | Backend Core y Telegram Bot | Python 3.10+, FastAPI, python-telegram-bot | Disponible |
| SOFTWARE | GitHub Action | Python Core para scripts de validación, Docker | Disponible |
| SOFTWARE | VS Code Extension | TypeScript, Node.js, API de VS Code | Disponible |
| HARDWARE | Despliegue VPS (Producción) | 2 vCPU, 2 GB RAM, 20 GB SSD | Disponible |
| SOFTWARE | Motores Soportados | PostgreSQL, MySQL/MariaDB, SQL Server, MongoDB | Disponible |

<div style="page-break-after: always; visibility: hidden"></div>

---

## 4. Estudio de Factibilidad

### 4.1 Factibilidad Técnica

El proyecto es técnicamente viable gracias a la abstracción de microservicios:
- **Modularidad:** El uso del Patrón Estrategia en FastAPI permite soportar 4 motores usando llamadas a subprocesos (`asyncio.create_subprocess_exec`) sin bloqueos.
- **Validación Rápida:** La validación de integridad para MySQL y PostgreSQL (leyendo los últimos 256 bytes) es ultrarrápida y aplicable tanto en la API, la Action y la extensión de VS Code.
- **Dockerización:** Asegura que los sidecars nativos requeridos estén empaquetados junto al código, eliminando el problema de "no funciona en mi máquina".

### 4.2 Factibilidad Económica

La solución basada en microservicios desplaza los costos hacia la infraestructura en la nube, pero gracias a los contenedores, el costo se mantiene mínimo.

| Categoría | Descripción | Costo Estimado (S/) |
|-----------|-------------|:----------:|
| VPS Cloud | Servidor Linux para Docker (FastAPI + Bot) - Anual | ~300.00 |
| Horas Hombre | 2 desarrolladores junior | ~9,600.00 |
| GitHub Actions | Minutos CI/CD gratuitos para repositorios públicos | 0.00 |
| **TOTAL** | | **S/ 9,900.00** |

### 4.3 Factibilidad Operativa

Es mucho más fácil de adoptar por los equipos. Los desarrolladores ya usan GitHub y VS Code; validar un backup ahora requiere solo presionar un atajo de teclado (`Ctrl + Shift + P` -> `SafeBridge: Verificar`) o hacer un push al repositorio. El Bot de Telegram permite solicitar respaldos remotos desde el teléfono.

### 4.4 Factibilidad Legal

Uso de software libre y frameworks Open Source (FastAPI, React, TypeScript). El token del Bot de Telegram está sujeto a los términos de servicio de la plataforma API de Telegram.

### 4.5 Factibilidad Social y Ambiental

Fomenta las buenas prácticas de DevSecOps mediante la integración continua. El bajo consumo de validaciones nativas ahorra cómputo (energía) frente a la restauración completa de contenedores para validación.

<div style="page-break-after: always; visibility: hidden"></div>

---

## 5. Análisis Financiero

Para una agencia o equipo DevOps de 5 integrantes:
- **Ahorro en QA de Backups:** 3 horas/semana en total (3h × S/ 30.00/h × 52 = **S/ 4,680.00**)
- **Prevención de pérdida de datos en Producción:** **S/ 12,000.00** (valor estimado del daño por caída de un sprint debido a base de datos corrupta).
- **Beneficio Anual:** ~S/ 16,680.00
- **VAN:** S/ 5,263.63 (Tasa 10%)
- **B/C:** 1.68

El proyecto es totalmente rentable.

<div style="page-break-after: always; visibility: hidden"></div>

---

## 6. Conclusiones

La evolución de SafeBridge hacia una arquitectura orientada a servicios (API, Extensiones IDE, CI/CD) representa una mejora significativa en escalabilidad, interoperabilidad y adopción. Es **factible** en todos sus aspectos y responde a las tendencias actuales de automatización DevOps y Local-first BCDR.

---

*Documento elaborado por: Iker Alberto Sierra Ruiz (2023077090) y Julio Samuel Cortez Mamani (2023077283) — Universidad Privada de Tacna, 2026.*
