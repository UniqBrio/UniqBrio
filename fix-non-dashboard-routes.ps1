# PowerShell script to update all non-dashboard API routes to use dbConnectAuth()

$patterns = @(
    @{ Old = '\bdbConnect\s*\('; New = 'dbConnectAuth(' }
)

# Get all TypeScript files in app/api that are NOT in the dashboard folder
$allFiles = Get-ChildItem -Path "d:\UniqBrio\app\api" -Filter "*.ts" -Recurse -File
$files = $allFiles | Where-Object { $_.FullName -notmatch '\\dashboard\\' }

Write-Host "Found $($files.Count) non-dashboard API route files to process" -ForegroundColor Cyan

$totalFixed = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    $fileFixed = $false
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern.Old) {
            $content = $content -replace $pattern.Old, $pattern.New
            $fileFixed = $true
        }
    }
    
    if ($fileFixed) {
        # Write with UTF-8 no BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host "Fixed: $($file.FullName.Replace('d:\UniqBrio\', ''))" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`nTotal non-dashboard files fixed: $totalFixed" -ForegroundColor Cyan
