$url = "https://archive.mariadb.org/mariadb-11.2.3/winx64-packages/mariadb-11.2.3-winx64.zip"
$zipPath = "D:\Codigos\Base de datos\Actualizacion\safebridge\src-tauri\resources\mariadb.zip"
$destFile = "D:\Codigos\Base de datos\Actualizacion\safebridge\src-tauri\binaries\mysqldump-x86_64-pc-windows-msvc.exe"

Write-Host "Los servidores de Oracle MySQL estan caidos. Descargando alternativa MariaDB (compatible con caching_sha2_password sin DLLs extra)..."
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Host "Extrayendo mariadb-dump.exe..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

$dumpExe = $zip.Entries | Where-Object { $_.FullName -like "*/bin/mariadb-dump.exe" }
if ($dumpExe) {
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($dumpExe, $destFile, $true)
    Write-Host "mariadb-dump.exe extraido y reemplazado exitosamente."
} else {
    Write-Host "No se encontro mariadb-dump.exe en el archivo ZIP."
}

$zip.Dispose()
Remove-Item $zipPath
Write-Host "Proceso finalizado."
