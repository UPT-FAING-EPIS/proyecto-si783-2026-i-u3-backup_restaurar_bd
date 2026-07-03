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

Informe Final de Proyecto — FD05

Versión *1.0*

<div style="page-break-after: always; visibility: hidden"></div>

# ÍNDICE GENERAL

- [1. Introducción y Alcance](#1-introducción-y-alcance)
- [2. Transición Arquitectónica (Monolito a Ecosistema)](#2-transición-arquitectónica-monolito-a-ecosistema)
- [3. Metodología de Desarrollo](#3-metodología-de-desarrollo)
- [4. Entregables y Repositorios](#4-entregables-y-repositorios)
- [5. Conclusiones y Logros del Equipo](#5-conclusiones-y-logros-del-equipo)

<div style="page-break-after: always; visibility: hidden"></div>

---

## 1. Introducción y Alcance

El presente documento constituye el informe de cierre (FD05) del proyecto **SafeBridge**. El propósito fundamental del sistema ha sido desde su inicio proveer herramientas para mitigar los riesgos de pérdida de datos mediante respaldos orquestados y validados.

El proyecto ha logrado superar las expectativas de su concepción original, al expandirse a lo largo de todo el ciclo de desarrollo (IDE, Pipelines CI/CD, y Notificaciones Remotas), brindando soluciones efectivas tanto a programadores individuales como a equipos DevSecOps.

## 2. Transición Arquitectónica (Monolito a Ecosistema)

Durante el ciclo de desarrollo, el equipo determinó que una aplicación de escritorio (Tauri/Rust) restringía severamente la capacidad de los administradores de sistemas para integrar las validaciones de base de datos en flujos automáticos y remotos.

**Las decisiones de ingeniería tomadas fueron:**
1. **Desarrollo de API Core:** La lógica fue migrada a Python (FastAPI), exponiendo los motores (Postgres, MySQL, SQL Server, MongoDB) mediante una API REST pura.
2. **Interfaz Conversacional (Telegram):** Se implementó un Bot que actúa como cliente primario de la API, permitiendo orquestación de bases de datos desde un teléfono móvil con resultados inmediatos.
3. **Validación CI/CD (GitHub Action):** Se abstrajo la lógica de verificación EOF (End Of File) y de prueba de restauración con Docker hacia un script Python compatible con los corredores de GitHub.
4. **Herramienta Local (VS Code):** Se implementó un plugin Node.js/TS ligero para proveer feedback inmediato en el editor sin depender de infraestructura pesada.

## 3. Metodología de Desarrollo

El equipo ha utilizado flujos ágiles basados en iteraciones (Sprints) cortas, con apoyo exhaustivo de herramientas colaborativas:
- **Gestión de Tareas:** Implementación de tableros Kanban en GitHub Projects.
- **Control de Versiones:** Aplicación de GitHub Flow (ramas *feature* combinadas a *main* mediante Pull Requests revisados).
- **Clean Architecture:** Estricta separación de responsabilidades, usando inyección de dependencias y el patrón de diseño Estrategia (`Strategy Pattern`).

## 4. Entregables y Repositorios

El producto final entregado se divide en tres componentes aislados y plenamente funcionales:
1. `safebridge-action`: Repositorio con el código Python para GitHub Actions.
2. `safebridge-telegram`: Repositorio con el microservicio FastAPI y el script del bot de Telegram listos para ser deplegados con Docker Compose.
3. `safebridge-vscode`: Proyecto TypeScript/Vite compilado a binario `.vsix` instalable en VS Code.

## 5. Conclusiones y Logros del Equipo

- **Objetivos Cumplidos:** Se ha logrado crear un ecosistema multiplataforma capaz de abarcar y solucionar los escenarios reales de pérdida de datos por corrupción de volcados.
- **Innovación en Validación:** La utilización de lecturas asíncronas de las firmas de final de archivo (EOF) para predecir salud del backup representa un hito en el desempeño de utilidades de bases de datos, ahorrando enormes cantidades de cómputo que normalmente requerirían levantar bases de datos temporales (salvo casos complejos como `.bak` resueltos vía Docker dinámico en GH Actions).
- **Crecimiento Técnico:** La diversificación de tecnologías asimiladas (Python avanzado con `asyncio`, FastAPI, Pydantic, GitHub Actions, Dockerizaciones complejas y TypeScript para extensiones de IDE) representa un logro académico de primer nivel para el equipo de trabajo.

El sistema SafeBridge queda formalmente presentado, funcional y escalable, superando con creces los requerimientos originales planteados en su informe de factibilidad.
