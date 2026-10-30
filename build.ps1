# ───────────────────────────────────────────────────────────────
#  Thumbnail Maker — build script (csc / .NET Framework 4.8)
# ───────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSCommandPath
Set-Location $root

$csc    = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$sdkDir = Join-Path $root '.build\wv2'
$refs   = Join-Path $sdkDir 'lib\net462'
$dist   = Join-Path $root 'dist'
$fx     = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319'
$wv2Ver = '1.0.3240.44'

if (-not (Test-Path $csc)) { throw "Không tìm thấy csc.exe của .NET Framework 4.8" }

# Tự tải Microsoft.Web.WebView2 SDK nếu chưa có (bản clone mới)
if (-not (Test-Path (Join-Path $refs 'Microsoft.Web.WebView2.Core.dll'))) {
    Write-Host "→ Tải WebView2 SDK $wv2Ver (một lần, ~9 MB)" -ForegroundColor DarkGray
    $zip = Join-Path $root '.build\webview2.zip'
    New-Item -ItemType Directory -Force -Path (Join-Path $root '.build') | Out-Null
    Invoke-WebRequest -Uri "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/$wv2Ver" `
                      -OutFile $zip -UseBasicParsing
    if (Test-Path $sdkDir) { Remove-Item $sdkDir -Recurse -Force }
    Expand-Archive -Path $zip -DestinationPath $sdkDir -Force
    Remove-Item $zip -Force
}
if (-not (Test-Path (Join-Path $refs 'Microsoft.Web.WebView2.Core.dll'))) {
    throw "WebView2 SDK không hợp lệ: $refs"
}

# Icon: cần Python + Pillow; nếu máy không có thì dùng icon đã commit trong assets/
$icon = Join-Path $root 'assets\app.ico'
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "→ Icon" -ForegroundColor DarkGray
    try { python (Join-Path $root 'assets\make_icon.py') 2>&1 | Out-Null } catch { }
}
if (-not (Test-Path $icon)) { throw "Thiếu assets\app.ico (cần Python + Pillow để tạo)" }

Write-Host "→ Compile" -ForegroundColor DarkGray
New-Item -ItemType Directory -Force -Path $dist | Out-Null

# Đóng app đang chạy và đợi file exe được giải phóng
Get-Process ThumbnailMaker -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
$exePath = Join-Path $dist 'ThumbnailMaker.exe'
for ($i = 0; $i -lt 40; $i++) {
    try {
        if (Test-Path $exePath) {
            $fs = [System.IO.File]::Open($exePath, 'Open', 'ReadWrite', 'None')
            $fs.Dispose()
        }
        break
    } catch {
        Start-Sleep -Milliseconds 250
    }
}
Get-ChildItem $dist -File | Where-Object { $_.Name -ne 'ThumbnailMaker.exe' } | Remove-Item -Force -ErrorAction SilentlyContinue

$args = @(
  '/nologo'
  '/target:winexe'
  '/platform:x64'
  '/optimize+'
  '/unsafe-'
  '/codepage:65001'
  "/out:$dist\ThumbnailMaker.exe"
  "/win32icon:$root\assets\app.ico"
  "/win32manifest:$root\assets\app.manifest"
  "/reference:$fx\System.dll"
  "/reference:$fx\System.Core.dll"
  "/reference:$fx\System.Drawing.dll"
  "/reference:$fx\System.Windows.Forms.dll"
  "/reference:$fx\System.Web.Extensions.dll"
  "/reference:$refs\Microsoft.Web.WebView2.Core.dll"
  "/reference:$refs\Microsoft.Web.WebView2.WinForms.dll"
  "/resource:$root\app\index.html,ui.index.html"
  "/resource:$root\app\style.css,ui.style.css"
  "/resource:$root\app\app.js,ui.app.js"
  "/resource:$root\assets\app.ico,app.ico"
  (Join-Path $root 'src\ThumbnailMaker.cs')
)

& $csc @args
if ($LASTEXITCODE -ne 0) { throw "csc thất bại ($LASTEXITCODE)" }

Write-Host "→ Copy runtime" -ForegroundColor DarkGray
Copy-Item "$refs\Microsoft.Web.WebView2.Core.dll"     $dist -Force
Copy-Item "$refs\Microsoft.Web.WebView2.WinForms.dll" $dist -Force
Copy-Item (Join-Path $root '.build\wv2\runtimes\win-x64\native\WebView2Loader.dll') $dist -Force

$total = (Get-ChildItem $dist -File | Measure-Object Length -Sum).Sum
Write-Host ""
Write-Host "  dist:" -ForegroundColor Green
Get-ChildItem $dist -File | Sort-Object Length -Descending |
  Select-Object @{n='file';e={$_.Name}}, @{n='KB';e={[math]::Round($_.Length/1KB,1)}} |
  Format-Table -AutoSize | Out-String | Write-Host
Write-Host ("  Tổng: {0:N0} KB" -f ($total/1KB)) -ForegroundColor Green
