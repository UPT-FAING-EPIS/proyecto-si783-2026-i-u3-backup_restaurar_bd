# 🌉 SafeBridge: Ecosistema Multi-Motor de Respaldos y Validación de Integridad

![Versión](https://img.shields.io/badge/version-3.0-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

**SafeBridge** es un ecosistema moderno y distribuido de herramientas orientadas a desarrolladores, administradores de bases de datos y equipos DevSecOps. Su objetivo principal es asegurar la **Continuidad del Negocio (BCDR)** mitigando la pérdida de datos mediante la generación orquestada y la validación matemática/binaria de los volcados (backups) de bases de datos.

Ya no dependas de archivos `.bak` o `.sql` que podrían estar corruptos. SafeBridge genera, entrega y verifica tus respaldos allí donde estés trabajando: desde tu IDE, tu pipeline de CI/CD, o tu teléfono celular.

---

## 🚀 Arquitectura del Ecosistema

El ecosistema de SafeBridge se compone de tres herramientas independientes que operan en diferentes fases del ciclo de vida del desarrollo de software:

### 1. 🤖 SafeBridge Telegram API (Orquestación Remota)
Un microservicio core desarrollado en **Python (FastAPI)** que funciona como el motor principal.
- **Generación Asíncrona**: Utiliza el *Strategy Pattern* para interactuar de forma segura con los comandos nativos de tu servidor (`pg_dump`, `mysqldump`, `sqlcmd`, `mongodump`).
- **Bot Conversacional**: Interactúa con un bot de Telegram seguro que recibe tus comandos y te devuelve físicamente el archivo del volcado a tu chat, acompañado de los logs completos de la operación.
- **Sin Bloqueos**: Desplegable en VPS vía Docker Compose, manejando peticiones HTTP/REST y background tasks para limpiar el almacenamiento de forma automática.

### 2. 🐙 SafeBridge Action (Integración Continua)
Una **Custom GitHub Action** esencial para tus pipelines de CI/CD.
- **Detección Automática**: Analiza los push y pull requests en busca de archivos de base de datos (`.sql`, `.bak`, `.bson`, `.archive`).
- **Validación Profunda (Docker)**: Para los archivos `.bak` de SQL Server, la Acción instanciará un contenedor temporal de SQL Server 2022, ejecutará `RESTORE VERIFYONLY` para verificar el archivo a nivel binario, y apagará el contenedor. Todo de forma transparente.
- **Validación Rápida (EOF)**: Para Postgres y MySQL, examina instantáneamente (en milisegundos) las firmas de finalización de archivo para certificar que el archivo no está corrupto ni truncado, fallando el pipeline (Exit 1) si detecta anomalías.

### 3. 💻 SafeBridge VS Code (Validación Local In-Editor)
Una **Extensión Nativa para Visual Studio Code** desarrollada en TypeScript y Node.js.
- **Retroalimentación Inmediata**: Diseñada para el desarrollador de a pie. No necesitas levantar Dockers pesados en tu máquina para saber si el volcado de tu cliente sirve.
- **Comando Rápido**: Solo debes usar la paleta de comandos (`Ctrl + Shift + P`) y ejecutar `SafeBridge: Verificar integridad de Backup`.
- **Análisis Nativo**: Lee inteligentemente los bytes finales del archivo y te avisa mediante un modal si tu archivo está corrupto.

---

## 🗄️ Motores Soportados

SafeBridge es agnóstico y compatible de forma nativa con los 4 gigantes de la industria:

| Motor de Base de Datos | Formato | Estrategia de Validación (Verificación) |
|------------------------|---------|-----------------------------------------|
| **PostgreSQL** | `.sql` | Verificación de EOF: `PostgreSQL database dump complete` |
| **MySQL / MariaDB** | `.sql` | Verificación de EOF: `Dump completed on` |
| **Microsoft SQL Server**| `.bak` | `RESTORE VERIFYONLY` mediante Docker (GitHub Action) |
| **MongoDB** | `.bson` / `.archive` | Validación de peso y cabeceras binarias BSON |

---

## 🛠️ Instalación y Uso de los Componentes

### 1. Despliegue de FastAPI + Telegram Bot
Para montar tu propio motor orquestador remoto en un VPS:
```bash
# 1. Clonar el microservicio
git clone https://github.com/tu-org/safebridge-telegram.git
cd safebridge-telegram

# 2. Configurar las credenciales de Telegram
cp .env.example .env
nano .env # Inserta aquí tu TELEGRAM_BOT_TOKEN entregado por BotFather

# 3. Levantar con Docker Compose
docker compose up -d
```
> El contenedor instalará automáticamente los clientes nativos (`postgresql-client`, `mssql-tools18`, etc.) y quedará listo para recibir peticiones por Telegram.

### 2. Configuración en GitHub Actions
Para agregar la barrera de seguridad de datos a cualquier repositorio:
Crea el archivo `.github/workflows/verificar-backup.yml` en tu repositorio:
```yaml
name: Verificador de Backups CI/CD
on: [push, pull_request]

jobs:
  validar-integridad:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validar Backups detectados
        uses: tu-usuario/safebridge-action@main
        with:
          file_path: 'auto'
```

### 3. Uso en VS Code
1. Descarga el binario `.vsix` desde el repositorio de `safebridge-vscode`.
2. En VS Code, ve a Extensiones -> `...` (Opciones) -> `Install from VSIX...`
3. Abre la carpeta donde guardas tus archivos `.sql` y utiliza la paleta de comandos.

---

## 👨‍💻 Acerca del Equipo

SafeBridge fue diseñado e implementado por el equipo de **BitCraft Solutions** como parte de la demostración arquitectónica de transición de sistemas monolíticos hacia ecosistemas DevOps y Microservicios.

**Integrantes:**
- Iker Alberto Sierra Ruiz
- Julio Samuel Cortez Mamani

> Universidad Privada de Tacna - Escuela Profesional de Ingeniería de Sistemas - 2026
