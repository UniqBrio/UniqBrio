# Fix files with local dbConnect function definitions
$ErrorActionPreference = "Stop"

Write-Host "Fixing files with local dbConnect function definitions..." -ForegroundColor Cyan

# List of files with local dbConnect functions
$filesToFix = @(
    "d:\UniqBrio\app\api\dashboard\payments\monthly-subscriptions\route.ts",
    "d:\UniqBrio\app\api\dashboard\payments\monthly-subscriptions\[id]\route.ts",
    "d:\UniqBrio\app\api\dashboard\payments\monthly-subscriptions\[id]\payments\route.ts"
)

$updateCount = 0

foreach ($filePath in $filesToFix) {
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        # Fix the function declaration - change from dbConnect("uniqbrio") back to dbConnect()
        $content = $content -replace 'async function dbConnect\("uniqbrio"\)', 'async function dbConnect()'
        
        # Also fix any calls to the local function
        $content = $content -replace 'await dbConnect\("uniqbrio"\);', 'await dbConnect();'
        
        if ($content -ne $originalContent) {
            # Write back with UTF-8 no-BOM encoding
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
            Write-Host "  Fixed: $filePath" -ForegroundColor Green
            $updateCount++
        }
    }
}

Write-Host "`nFixed $updateCount files with local dbConnect functions" -ForegroundColor Cyan
