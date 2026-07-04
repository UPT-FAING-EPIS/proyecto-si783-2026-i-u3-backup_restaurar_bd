# 🛡️ SafeBridge VS Code Extension

![VS Code](https://img.shields.io/badge/VS_Code-Ready-blue?logo=visualstudiocode)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

**SafeBridge Verifier** es una extensión nativa para Visual Studio Code diseñada para desarrolladores y administradores de bases de datos. Te permite comprobar de manera inteligente, inmediata y **totalmente local** la integridad de tus copias de seguridad de bases de datos, directamente desde tu editor de código favorito.

Esta herramienta forma parte del **Ecosistema SafeBridge**, proporcionando la capa de validación en el entorno de desarrollo (Local-First).

---

## ✨ Características

- ⚡ **Validación Ultrarrápida**: No importa si tu archivo `.sql` pesa 10 GB. SafeBridge lee de manera inteligente solo los bytes finales (EOF) usando los flujos de lectura de Node.js (`fs`), validando la integridad en milisegundos.
- 🐘 **PostgreSQL Soportado**: Detecta firmas `PostgreSQL database dump complete`.
- 🐬 **MySQL Soportado**: Detecta firmas `Dump completed on`.
- 🟢 **MongoDB Soportado**: Valida tamaño y cabeceras de archivos `.bson` y `.archive`.
- 🟥 **SQL Server Soportado**: Identificación rápida de cabeceras de archivos `.bak`.
- 🔒 **100% Local y Seguro**: La extensión no envía tus archivos a ninguna API externa ni sube tus volcados a la nube. Todo el análisis ocurre en la memoria local de tu equipo.

---

## 🚀 Uso

Utilizar SafeBridge es extremadamente sencillo:

1. Abre tu proyecto en VS Code.
2. Abre la paleta de comandos (`Ctrl + Shift + P` en Windows/Linux, `Cmd + Shift + P` en Mac).
3. Escribe e invoca el comando: **`SafeBridge: Verificar integridad de Backup`**.
4. Selecciona el archivo de volcado desde el explorador de archivos nativo que se abrirá.
5. Recibe tu validación inmediatamente mediante notificaciones (Toasts) nativas de VS Code indicándote si el archivo está sano o corrupto.

---

## 📦 Instalación

### Desde el Marketplace (Próximamente)
Busca "SafeBridge" en el panel de extensiones de VS Code e instálalo.

### Instalación Manual (Local)
1. Descarga el binario `.vsix` desde los Releases de GitHub.
2. Abre VS Code.
3. Dirígete a Extensiones > Haz clic en `...` (Más acciones) > **Install from VSIX...**
4. Selecciona el archivo descargado.

---

## 💻 Entorno de Desarrollo (Contribución)

Si deseas modificar el código o compilar la extensión por tu cuenta:

1. Clona el repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Presiona `F5` en VS Code. Esto abrirá una nueva ventana de VS Code [Extension Development Host] donde podrás probar el comando inmediatamente.
4. Para empaquetar el instalador `.vsix`:
   ```bash
   npx vsce package
   ```

---

## 📄 Licencia
Este proyecto se encuentra bajo la Licencia **MIT**.
