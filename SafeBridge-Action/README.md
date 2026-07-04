# 🛡️ SafeBridge Action: Verificador CI/CD de Respaldos de Base de Datos

![GitHub Marketplace](https://img.shields.io/badge/Marketplace-SafeBridge_Action-blue?logo=github)
![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Docker Supported](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**SafeBridge Action** es una *Custom GitHub Action* diseñada para proteger tus pipelines de Integración Continua (CI/CD) frente a la corrupción silenciosa de datos. Esta acción intercepta, lee y verifica matemáticamente o mediante restauración en contenedores efímeros, la integridad de los archivos de volcado de tus bases de datos.

Es un pilar fundamental del **Ecosistema SafeBridge**, implementando lógica nativa en Python bajo los principios de *Clean Architecture* para asegurar de que tus `.bak`, `.sql`, o `.bson` están siempre sanos y listos para producción.

---

## ✨ Características Principales

Esta herramienta infiere inteligentemente cómo debe tratar cada archivo de respaldo según su extensión y su naturaleza:

- 🐘 **PostgreSQL (`.sql`)**: Validación Ultrarrápida. Inspecciona los bytes finales del archivo buscando la firma asíncrona de EOF (`PostgreSQL database dump complete`). No requiere levantar el motor.
- 🐬 **MySQL / MariaDB (`.sql`)**: Validación Ultrarrápida. Búsqueda exacta de la firma transaccional de finalización (`Dump completed on`).
- 🟢 **MongoDB (`.bson` / `.archive`)**: Validación Estructural. Verifica cabeceras y bytes activos para descartar archivos vacíos o truncados por fallos de red.
- 🟥 **Microsoft SQL Server (`.bak`)**: Validación Profunda y Aislada. El Action orquesta automáticamente un contenedor de Docker (`mcr.microsoft.com/mssql/server:2022-latest`), monta un volumen efímero y ejecuta una instrucción `RESTORE VERIFYONLY`. Tras emitir el veredicto binario de la estructura del `.bak`, el contenedor se autodestruye.

> ⚡ **Cero Falsos Positivos**: Si SafeBridge marca el archivo con un check verde, el archivo es 100% restaurable. Si está corrupto, la acción rompe el pipeline intencionalmente con código de salida (`Exit 1`).

---

## 🚀 Uso en tus Repositorios

Integrar SafeBridge Action a tu proyecto actual toma menos de un minuto.

### Escenario 1: Modo Automático (Recomendado)
El modo "Auto" explorará recursivamente tu repositorio buscando el primer archivo `.bak`, `.sql`, `.bson` o `.archive` y lo validará automáticamente. Es perfecto para repositorios dedicados a guardar respaldos cronometrados.

Crea un archivo en `.github/workflows/safebridge-verify.yml`:

```yaml
name: CI/CD - Validar Integridad de Backup

on:
  push:
    paths:
      - '**/*.bak'
      - '**/*.sql'
      - '**/*.bson'
      - '**/*.archive'
  pull_request:

jobs:
  verificar-salud-bd:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Obtener código fuente
        uses: actions/checkout@v4
        
      - name: 🛡️ Ejecutar SafeBridge Action
        uses: tu-organizacion/safebridge-action@v3
        # No necesitas declarar 'with:', por defecto operará en modo 'auto'.
```

### Escenario 2: Configuración Avanzada / Modo Manual
Si guardas múltiples backups y quieres validar un archivo en específico, o si necesitas alterar la contraseña de la base de datos efímera de SQL Server:

```yaml
      - name: 🛡️ Validación Explícita de SQL Server
        uses: tu-organizacion/safebridge-action@v3
        with:
          file_path: 'produccion/ventas_q3.bak'
          sqlserver_password: 'Clave_Temporal_SuperSegura123!'
```

---

## ⚙️ Parámetros de Entrada (`inputs`)

| Nombre del Input | Descripción | Valor por Defecto | Requerido |
|------------------|-------------|:-----------------:|:---------:|
| `file_path` | Ruta relativa al archivo. Usa `auto` para descubrimiento inteligente. | `auto` | No |
| `sqlserver_password` | Clave del usuario `SA` inyectada al contenedor de validación `.bak`. | `YourStrong!Passw0rd` | No |

---

## 💻 Desarrollo Local y Testing

Si deseas realizar modificaciones al núcleo (`verify_backup.py`) o probar su efectividad sin subir el código a GitHub, puedes correr la lógica pura de la Acción en tu entorno local:

### Prerrequisitos
- **Python 3.10** o superior.
- **Docker Engine** (Obligatorio solo si intentarás validar localmente archivos `.bak` de SQL Server).

### Ejecución
1. Clona este repositorio y navega al directorio.
2. Instala los requerimientos base:
   ```bash
   pip install -r requirements.txt
   ```
3. Llama al core pasándole el archivo objetivo:
   ```bash
   python src/verify_backup.py --file "./test_files/dump_roto.sql"
   ```

*(Nota: Para entornos locales validando SQL Server, deberás especificar el host mediante banderas adicionales del script: `--server "localhost,1433" --user "SA" --password "Clave"`).*

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Eres libre de utilizarlo, modificarlo y distribuirlo, tanto en proyectos Open Source como de carácter comercial.
