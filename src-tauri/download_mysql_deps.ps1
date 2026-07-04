# Script para descargar las DLLs necesarias de MySQL para soporte de caching_sha2_password
# Usa MariaDB 11.7+ como fuente ya que incluye los plugins de auth necesarios para MySQL 8+

$destPath = Join-Path $PSScriptRoot "resources\mysql_deps"
$destBin = Join-Path $PSScriptRoot "binaries"

# Crear directorio si no existe
if (-not (Test-Path $destPath)) {
    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
}

$url = "https://archive.mariadb.org/mariadb-11.7.2/winx64-packages/mariadb-11.7.2-winx64.zip"
$zipPath = Join-Path $PSScriptRoot "resources\mariadb_deps.zip"

Write-Host "Descargando MariaDB 11.7.2 (incluye plugins de autenticacion para MySQL 8+)..."
Write-Host "URL: $url"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    $ProgressPreference = 'Continue'
    
    Write-Host "Descarga completada. Extrayendo archivos necesarios..."
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    
    # 1. Plugin caching_sha2_password.dll (ESENCIAL para MySQL 8+)
    $cachingSha2 = $zip.Entries | Where-Object { $_.FullName -like "*/lib/plugin/caching_sha2_password.dll" }
    if ($cachingSha2) { 
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($cachingSha2, "$destPath\caching_sha2_password.dll", $true) 
        Write-Host "  [OK] caching_sha2_password.dll"
    }
    
    # 2. Plugin sha256_password.dll
    $sha256 = $zip.Entries | Where-Object { $_.FullName -like "*/lib/plugin/sha256_password.dll" }
    if ($sha256) { 
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($sha256, "$destPath\sha256_password.dll", $true) 
        Write-Host "  [OK] sha256_password.dll"
    }
    
    # 3. Actualizar mysqldump binario
    $dumpExe = $zip.Entries | Where-Object { $_.FullName -like "*/bin/mariadb-dump.exe" }
    if ($dumpExe) {
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($dumpExe, "$destBin\mysqldump-x86_64-pc-windows-msvc.exe", $true)
        Write-Host "  [OK] mysqldump actualizado"
    }
    
    $zip.Dispose()
    Remove-Item $zipPath -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "=== Proceso finalizado exitosamente ==="
    Write-Host "Plugins instalados en: $destPath"
    Get-ChildItem $destPath -Filter "*.dll" | ForEach-Object { Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 1)) KB)" }
    
} catch {
    Write-Host "Error: $_"
    Write-Host ""
    Write-Host "SOLUCION MANUAL:"
    Write-Host "1. Descarga MariaDB 11.7+ ZIP desde https://mariadb.org/download/"
    Write-Host "2. Extrae estos archivos a: $destPath"
    Write-Host "   - lib/plugin/caching_sha2_password.dll"
    Write-Host "   - lib/plugin/sha256_password.dll"
    exit 1
}
