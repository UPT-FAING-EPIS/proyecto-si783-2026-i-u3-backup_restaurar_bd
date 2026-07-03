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

**Diccionario de Datos (Payloads y Schemas) — SafeBridge API**

*Nota: Con la evolución a una arquitectura de microservicios, el sistema SafeBridge no almacena estados persistentes locales en SQLite, sino que utiliza FastAPI con modelos de validación Pydantic para intercambio de datos JSON. Este diccionario describe dichas estructuras.*

---

## 1. Schema: `BackupRequest`

Estructura de datos (JSON) requerida por el endpoint `POST /api/v1/generar` para procesar y crear un nuevo volcado de base de datos de manera remota.

| Campo | Tipo de Dato (Python/JSON) | Obligatorio | Descripción | Ejemplo |
|-------|-----------------------------|:-----------:|-------------|---------|
| `engine` | string (Enum) | Sí | El motor de base de datos objetivo. Valores permitidos: `postgres`, `mysql`, `sqlserver`, `mongodb`. | `"postgres"` |
| `host` | string | Sí | Dirección IP o dominio donde reside el servidor de base de datos. | `"192.168.1.10"` |
| `port` | integer | Sí | Puerto TCP de escucha del servidor. | `5432` |
| `username` | string | Sí | Usuario con privilegios de lectura/volcado. | `"postgres"` |
| `password` | string | Sí | Contraseña de autenticación (se envía segura vía HTTPS). | `"SuperSecret!1"` |
| `database_name` | string | Sí | El nombre de la base de datos específica de la cual extraer los datos. | `"db_ventas"` |

---

## 2. Salidas: `FileResponse` y Headers Personalizados

Cuando se ejecuta correctamente el flujo de generación en la API, FastAPI no retorna un JSON genérico; retorna directamente el archivo físico del volcado (`.sql`, `.bak`, `.archive`) como un stream binario (`application/octet-stream`).

Para adjuntar la metadata y los logs del proceso asíncrono, se inyectan en los encabezados HTTP (Headers).

| Header (Cabecera HTTP) | Tipo | Descripción | Ejemplo |
|------------------------|------|-------------|---------|
| `X-Backup-Status` | string | Estado general de la transacción. | `SUCCESS` o `FAILED` |
| `X-Backup-Logs` | string | Resumen en texto o codificado en base64 con la salida capturada `stdout` y `stderr` del subproceso ejecutado en el sistema operativo (ej: `pg_dump`). | `"Dump completed successfully in 4s."` |

---

## 3. Schema: `VerifyResponse`

Estructura de datos JSON devuelta por el endpoint `POST /api/v1/verificar` tras subir y procesar un archivo físico usando `UploadFile`.

| Campo | Tipo de Dato (JSON) | Obligatorio | Descripción | Ejemplo |
|-------|----------------------|:-----------:|-------------|---------|
| `is_valid` | boolean | Sí | Indica contundentemente si el archivo superó las métricas de integridad. | `true` |
| `status_message` | string | Sí | Mensaje humano resumen de la evaluación. | `"Sano (Firma EOF encontrada)"` |
| `engine_detected` | string | Sí | Motor inferido por la lógica del verificador basado en extensión o firma. | `"postgres"` |
| `logs` | array of strings | Sí | Bitácora de análisis, paso a paso (ej: lectura de tamaño, lectura de últimos 256 bytes, ejecución de regex, etc.). | `["Tamaño 15MB", "Buscando firma...", "PostgreSQL EOF detectado"]` |

---

*Documento generado por el equipo BitCraft Solutions — Universidad Privada de Tacna, 2026.*
