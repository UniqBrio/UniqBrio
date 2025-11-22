# Update all dashboard routes to use dbConnect("uniqbrio")
$ErrorActionPreference = "Stop"

Write-Host "Updating dashboard routes to use dbConnect('uniqbrio')..." -ForegroundColor Cyan

# Get all TypeScript files in dashboard folder
$files = Get-ChildItem -Path "d:\UniqBrio\app\api\dashboard" -Filter "*.ts" -Recurse -File

$updateCount = 0
$fileCount = 0

foreach ($file in $files) {
    $fileCount++
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    
    # Replace dbConnect() or dbConnect with dbConnect("uniqbrio")
    $content = $content -replace '\bdbConnect\s*\(\s*\)', 'dbConnect("uniqbrio")'
    
    # Replace dbConnectDashboard() with dbConnect("uniqbrio")
    $content = $content -replace '\bdbConnectDashboard\s*\(\s*\)', 'dbConnect("uniqbrio")'
    
    # Replace import statements
    $content = $content -replace 'import\s*\{\s*dbConnectDashboard\s*\}', 'import { dbConnect }'
    
    if ($content -ne $originalContent) {
        # Write back with UTF-8 no-BOM encoding
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host "  Updated: $($file.FullName)" -ForegroundColor Green
        $updateCount++
    }
}

Write-Host "`nProcessed $fileCount files, updated $updateCount files" -ForegroundColor Cyan
Write-Host "Dashboard routes now use dbConnect('uniqbrio')" -ForegroundColor Green
