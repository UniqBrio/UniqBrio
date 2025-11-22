# Update all non-dashboard routes to use dbConnect("uniqbrio-admin")
$ErrorActionPreference = "Stop"

Write-Host "Updating non-dashboard routes to use dbConnect('uniqbrio-admin')..." -ForegroundColor Cyan

# Get all TypeScript files in app/api, excluding dashboard folder
$allFiles = Get-ChildItem -Path "d:\UniqBrio\app\api" -Filter "*.ts" -Recurse -File
$files = $allFiles | Where-Object { $_.FullName -notmatch '\\dashboard\\' }

$updateCount = 0
$fileCount = 0

foreach ($file in $files) {
    $fileCount++
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    
    # Replace dbConnect() or dbConnect with dbConnect("uniqbrio-admin")
    $content = $content -replace '\bdbConnect\s*\(\s*\)', 'dbConnect("uniqbrio-admin")'
    
    # Replace dbConnectAuth() with dbConnect("uniqbrio-admin")
    $content = $content -replace '\bdbConnectAuth\s*\(\s*\)', 'dbConnect("uniqbrio-admin")'
    
    # Replace import statements
    $content = $content -replace 'import\s*\{\s*dbConnectAuth\s*\}', 'import { dbConnect }'
    
    if ($content -ne $originalContent) {
        # Write back with UTF-8 no-BOM encoding
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host "  Updated: $($file.FullName)" -ForegroundColor Green
        $updateCount++
    }
}

Write-Host "`nProcessed $fileCount files, updated $updateCount files" -ForegroundColor Cyan
Write-Host "Non-dashboard routes now use dbConnect('uniqbrio-admin')" -ForegroundColor Green
