# PowerShell script to update dashboard routes to use dbConnectDashboard()

Write-Host "Updating dashboard API routes to use dbConnectDashboard()..." -ForegroundColor Cyan

# Get all TypeScript files in app/api/dashboard
$files = Get-ChildItem -Path "d:\UniqBrio\app\api\dashboard" -Filter "*.ts" -Recurse -File

$totalFixed = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    $modified = $false
    
    # Replace import statement
    if ($content -match 'import\s*\{\s*dbConnect\s*\}\s*from\s*[''"]@/lib/mongodb[''"]') {
        $content = $content -replace 'import\s*\{\s*dbConnect\s*\}\s*from\s*([''"])@/lib/mongodb\1', 'import { dbConnectDashboard } from $1@/lib/mongodb$1'
        $modified = $true
    }
    
    # Replace function calls
    if ($content -match '\bdbConnect\s*\(') {
        $content = $content -replace '\bdbConnect\s*\(', 'dbConnectDashboard('
        $modified = $true
    }
    
    if ($modified) {
        # Write with UTF-8 no BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host "Fixed: $($file.FullName.Replace('d:\UniqBrio\', ''))" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`nTotal dashboard routes fixed: $totalFixed" -ForegroundColor Cyan
Write-Host "`nNow updating auth routes to use dbConnectAuth()..." -ForegroundColor Cyan

# Update auth routes (everything except dashboard)
$authPaths = @(
    "d:\UniqBrio\app\api\auth",
    "d:\UniqBrio\app\api\register",
    "d:\UniqBrio\app\api\kyc*",
    "d:\UniqBrio\app\api\user-*",
    "d:\UniqBrio\app\api\verify-*",
    "d:\UniqBrio\app\api\admin*",
    "d:\UniqBrio\app\api\debug*",
    "d:\UniqBrio\app\api\upload*",
    "d:\UniqBrio\app\api\test*"
)

$authFixed = 0

foreach ($pathPattern in $authPaths) {
    $matchingFiles = Get-ChildItem -Path $pathPattern -Filter "*.ts" -Recurse -File -ErrorAction SilentlyContinue
    
    foreach ($file in $matchingFiles) {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $modified = $false
        
        # Replace import statement
        if ($content -match 'import\s*\{\s*dbConnect\s*\}\s*from\s*[''"]@/lib/mongodb[''"]') {
            $content = $content -replace 'import\s*\{\s*dbConnect\s*\}\s*from\s*([''"])@/lib/mongodb\1', 'import { dbConnectAuth } from $1@/lib/mongodb$1'
            $modified = $true
        }
        
        # Replace function calls
        if ($content -match '\bdbConnect\s*\(') {
            $content = $content -replace '\bdbConnect\s*\(', 'dbConnectAuth('
            $modified = $true
        }
        
        if ($modified) {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
            Write-Host "Fixed: $($file.FullName.Replace('d:\UniqBrio\', ''))" -ForegroundColor Yellow
            $authFixed++
        }
    }
}

Write-Host "`nTotal auth routes fixed: $authFixed" -ForegroundColor Cyan
Write-Host "`n=== Summary ===" -ForegroundColor Magenta
Write-Host "Dashboard routes (uniqbrio database): $totalFixed files" -ForegroundColor Green
Write-Host "Auth routes (uniqbrio-admin database): $authFixed files" -ForegroundColor Yellow
Write-Host "`nDone!" -ForegroundColor Cyan
