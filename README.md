<div align="center">

# 🌉 SafeBridge

**Sistema de gestión y automatización de backups para bases de datos utilizando principios de Clean Architecture.**

`#AutomatizaciónDeBasesDeDatos` `#Rust` `#Tauri` `#React`

<!-- Badges -->

![Version](https://img.shields.io/badge/Versión-0.1.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Estado-En_desarrollo-success?style=for-the-badge)
![Language](https://img.shields.io/badge/Lenguaje-Rust%20%7C%20TypeScript-orange?style=for-the-badge)
![License](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)

[LINK A DOCUMENTACIÓN COMPLETA] | [LINK AL DEMO/VIDEO]

</div>

---

## 📌 Descripción General

**SafeBridge** es una aplicación de escritorio multiplataforma (optimizada para Windows) diseñada para resolver la complejidad en la automatización, gestión y auditoría de copias de seguridad de múltiples motores de bases de datos. Evitando dependencias pesadas como Docker, utiliza volcados nativos rápidos y seguros mientras provee una experiencia de usuario moderna y fluida.

![Screenshot de la Interfaz Principal][IMAGEN]

---

## 🚀 Características Principales

- 🔐 **Gestión de Conexiones Segura**: CRUD completo de credenciales con cifrado local fuerte (AES-256-GCM).
- ⚡ **Backups Nativos y Veloces**: Ejecución de sidecars nativos (`pg_dump`, `mysqldump`, `sqlcmd`, `mongodump`) para garantizar resiliencia en redes restringidas sin depender de contenedores.
- 🛡️ **Verificación de Integridad Profunda**: Validación automática mediante la lectura de firmas de éxito nativas y generación de hashes **SHA-256** para auditoría y comprobación antifraude.
- 📊 **Historial y Auditoría Persistente**: Registro completo en SQLite local, capturando métricas clave (duración, tamaño) y logs completos por cada ejecución.
- 📈 **Dashboard Analítico**: Visualización gráfica intuitiva sobre métricas de éxito, errores y actividad reciente.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend / Core**: Rust, Tauri v2, rusqlite (SQLite).
- **Seguridad**: Algoritmo de cifrado AES-256-GCM.
- **Motores Soportados**: PostgreSQL, MySQL, SQL Server, MongoDB.

---

## 🏗️ Arquitectura

SafeBridge ha sido diseñado siguiendo estrictamente los principios de **Clean Architecture**, asegurando un alto nivel de mantenibilidad, escalabilidad y testabilidad del código. La lógica de negocio central (Rust) está completamente desacoplada de la capa de presentación (React/Tauri), facilitando la integración de nuevos motores de bases de datos y herramientas de cifrado sin alterar el núcleo del sistema.

---

## ⚙️ Instalación y Despliegue Local

Sigue estos pasos para levantar el proyecto en tu entorno local.

### Prerrequisitos

Asegúrate de contar con lo siguiente instalado en tu sistema:

- **Node.js** (v18 o superior)
- **Rust** y **Cargo**
- _Opcional:_ Las herramientas nativas (`pg_dump`, `mysqldump`, etc.) deben descargarse como sidecars en `src-tauri/binaries/` para realizar pruebas reales.

### Pasos

1. **Clonar el repositorio:**

   ```bash
   git clone [LINK-DEL-REPOSITORIO]
   cd safebridge
   ```

2. **Instalar dependencias del Frontend:**

   ```bash
   npm install
   ```

3. **Ejecutar la aplicación en modo desarrollo:**

   ```bash
   npm run tauri dev
   ```

4. **(Opcional) Compilación para producción (Genera Instalador):**
   ```bash
   npm run tauri build
   ```

---

## 💻 Uso

1. Inicia la aplicación.
2. Navega a la sección de **Conexiones** y añade un nuevo motor de base de datos (tus credenciales se guardarán encriptadas localmente).
3. Dirígete a **Backup** y selecciona la base de datos de la que deseas realizar un respaldo.
4. Presiona el botón de iniciar y espera a que el sistema valide automáticamente la integridad del archivo generado.
5. Puedes auditar el resultado completo y los hashes criptográficos en la pestaña de **Historial**.

---

## 🤝 Contribución

¡Las contribuciones son siempre bienvenidas! Si deseas ayudar a mejorar SafeBridge, por favor:

1. Haz un fork del repositorio.
2. Crea una rama para tu feature (`git checkout -b feature/NuevaFuncionalidad`).
3. Haz commit de tus cambios (`git commit -m 'feat: Agrega nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/NuevaFuncionalidad`).
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **[Tipo de Licencia, ej: MIT]**. Consulta el archivo `LICENSE` para más detalles.
