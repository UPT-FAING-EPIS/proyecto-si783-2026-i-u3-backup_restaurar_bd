$ErrorActionPreference = 'Stop'

$projectName = "SafeBridge"
$version = "1.0.0"
$baseDir = "D:\Codigos\Base de datos\Actualizacion\safebridge"
$targetRelease = Join-Path $baseDir "src-tauri\target\release"
$outputDir = "D:\Codigos\Base de datos\Actualizacion\SF comprimido"
$portableDir = Join-Path $outputDir "${projectName}-Portable"
$zipFile = Join-Path $outputDir "${projectName}-Portable-v${version}.zip"

# Crear directorio de salida si no existe
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Write-Host "=== Creando version portable de SafeBridge ==="
Write-Host ""

# 1. Crear directorio portable limpio
Write-Host "Preparando directorio portable..."
if (Test-Path $portableDir) {
    Remove-Item -Recurse -Force $portableDir
}
New-Item -ItemType Directory -Path $portableDir | Out-Null

# 2. Copiar ejecutable principal
Write-Host "Copiando ejecutable principal..."
Copy-Item (Join-Path $targetRelease "safebridge.exe") -Destination $portableDir
Write-Host "  [OK] safebridge.exe"

# 3. Copiar sidecars (binarios de backup)
Write-Host "Copiando herramientas de backup..."
$sidecars = @("mysqldump.exe", "pg_dump.exe", "sqlcmd.exe", "mongodump.exe")
foreach ($sidecar in $sidecars) {
    $src = Join-Path $targetRelease $sidecar
    if (Test-Path $src) {
        Copy-Item $src -Destination $portableDir
        $size = [math]::Round((Get-Item $src).Length / 1MB, 1)
        Write-Host "  [OK] $sidecar ($size MB)"
    } else {
        Write-Warning "  [SKIP] $sidecar no encontrado"
    }
}

# 4. Copiar resources (incluyendo mysql_deps con DLLs de auth)
Write-Host "Copiando recursos y plugins..."
$resourcesSrc = Join-Path $targetRelease "resources"
if (Test-Path $resourcesSrc) {
    Copy-Item -Recurse $resourcesSrc -Destination $portableDir
    
    # Verificar que las DLLs criticas esten presentes
    $mysqlDeps = Join-Path $portableDir "resources\mysql_deps"
    if (Test-Path (Join-Path $mysqlDeps "caching_sha2_password.dll")) {
        Write-Host "  [OK] resources/mysql_deps/caching_sha2_password.dll"
    } else {
        Write-Warning "  [WARN] caching_sha2_password.dll no encontrada en resources"
        # Copiar desde src-tauri si no esta
        $srcDll = Join-Path $baseDir "src-tauri\resources\mysql_deps\caching_sha2_password.dll"
        if (Test-Path $srcDll) {
            if (-not (Test-Path $mysqlDeps)) { New-Item -ItemType Directory -Path $mysqlDeps | Out-Null }
            Copy-Item $srcDll -Destination $mysqlDeps
            Write-Host "  [OK] caching_sha2_password.dll copiada desde src-tauri"
        }
    }
    if (Test-Path (Join-Path $mysqlDeps "sha256_password.dll")) {
        Write-Host "  [OK] resources/mysql_deps/sha256_password.dll"
    }
    
    Write-Host "  [OK] resources folder"
} else {
    Write-Warning "  Resources folder not found in release"
}

# 5. Copiar WebView2 loader si existe
$webview2 = Join-Path $targetRelease "WebView2Loader.dll"
if (Test-Path $webview2) {
    Copy-Item $webview2 -Destination $portableDir
    Write-Host "  [OK] WebView2Loader.dll"
}

# 6. Crear ZIP
Write-Host ""
Write-Host "Creando archivo ZIP..."
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}
Compress-Archive -Path "$portableDir\*" -DestinationPath $zipFile
$zipSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 1)
Write-Host "  [OK] $zipFile ($zipSize MB)"

# 7. Copiar instalador NSIS si existe
Write-Host ""
Write-Host "Buscando instalador NSIS..."
$nsisDir = Join-Path $baseDir "src-tauri\target\release\bundle\nsis"
$nsisExe = Get-ChildItem $nsisDir -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nsisExe) {
    $installerDest = Join-Path $outputDir "${projectName}-Installer-v${version}.exe"
    Copy-Item $nsisExe.FullName -Destination $installerDest
    $installerSize = [math]::Round((Get-Item $installerDest).Length / 1MB, 1)
    Write-Host "  [OK] $installerDest ($installerSize MB)"
} else {
    Write-Warning "  Instalador NSIS no encontrado"
}

Write-Host ""
Write-Host "=== Proceso completado ==="
Write-Host "Contenido de salida:"
Get-ChildItem $outputDir | ForEach-Object {
    $size = if ($_.PSIsContainer) { "(carpeta)" } else { "$([math]::Round($_.Length / 1MB, 1)) MB" }
    Write-Host "  $($_.Name) - $size"
}
