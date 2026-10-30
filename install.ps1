# ───────────────────────────────────────────────────────────────
#  Cài "Thumbnail Maker" vào máy (theo từng người dùng, không cần admin)
#  - build bản mới nhất
#  - copy vào %LOCALAPPDATA%\Programs\ThumbnailMaker
#  - tạo shortcut Desktop + Start Menu
# ───────────────────────────────────────────────────────────────
param(
  [switch]$SkipBuild,
  [switch]$NoDesktopShortcut
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSCommandPath

if (-not $SkipBuild) {
  Write-Host "→ Build" -ForegroundColor Cyan
  & (Join-Path $root 'build.ps1')
}

$target = Join-Path $env:LOCALAPPDATA 'Programs\ThumbnailMaker'
New-Item -ItemType Directory -Force -Path $target | Out-Null
Get-ChildItem $target -File | Remove-Item -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $root 'dist\*') $target -Recurse -Force
$exe = Join-Path $target 'ThumbnailMaker.exe'
if (-not (Test-Path $exe)) { throw "Thiếu $exe" }

$shell = New-Object -ComObject WScript.Shell

function New-Shortcut([string]$path) {
  $lnk = $shell.CreateShortcut($path)
  $lnk.TargetPath = $exe
  $lnk.WorkingDirectory = $target
  $lnk.IconLocation = "$exe,0"
  $lnk.Description = 'Thumbnail Maker — ghép ảnh thumbnail nhanh'
  $lnk.WindowStyle = 1
  $lnk.Save()
}

if (-not $NoDesktopShortcut) {
  $desktop = [Environment]::GetFolderPath('Desktop')
  New-Shortcut (Join-Path $desktop 'Thumbnail Maker.lnk')
  Write-Host "  ✓ Desktop shortcut" -ForegroundColor Green
}

$startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
New-Shortcut (Join-Path $startMenu 'Thumbnail Maker.lnk')
Write-Host "  ✓ Start Menu shortcut" -ForegroundColor Green

Write-Host ""
Write-Host "  Đã cài tại: $target" -ForegroundColor Green
Write-Host "  Dung lượng: $([math]::Round(((Get-ChildItem $target -File | Measure-Object Length -Sum).Sum)/1KB,0)) KB" -ForegroundColor Green
Write-Host ""
Write-Host "  Mở app: nhấn nút Start → gõ 'Thumbnail Maker'," -ForegroundColor Gray
Write-Host "          hoặc nhấp đúp shortcut ngoài Desktop." -ForegroundColor Gray
Write-Host "  Gỡ cài: xoá thư mục trên + 2 shortcut." -ForegroundColor DarkGray
