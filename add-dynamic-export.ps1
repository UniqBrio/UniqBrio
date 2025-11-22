$filesToUpdate = @(
    'app\dashboard\services\page.tsx',
    'app\dashboard\services\courses\page.tsx',
    'app\dashboard\crm\page.tsx',
    'app\dashboard\sell\page.tsx',
    'app\dashboard\settings\page.tsx',
    'app\dashboard\task-management\page.tsx',
    'app\dashboard\user\page.tsx',
    'app\dashboard\user\students\page.tsx',
    'app\dashboard\user\parents\page.tsx',
    'app\dashboard\user\alumni\page.tsx',
    'app\dashboard\user\students\leave\page.tsx',
    'app\dashboard\user\students\attendance\page.tsx',
    'app\dashboard\services\cohorts\page.tsx',
    'app\dashboard\services\schedule\page.tsx'
)

foreach ($file in $filesToUpdate) {
    $fullPath = Join-Path "d:\UniqBrio" $file
    
    if (Test-Path $fullPath) {
        $content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
        
        # Check if already has dynamic export
        if ($content -match 'export const dynamic') {
            Write-Host "Skip (already has dynamic): $file" -ForegroundColor Yellow
            continue
        }
        
        # Add dynamic export after "use client"
        if ($content -match '"use client"') {
            $newContent = $content -replace '("use client")', "`$1`n`nexport const dynamic = 'force-dynamic'"
            
            # Write with UTF-8 no BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($fullPath, $newContent, $utf8NoBom)
            
            Write-Host "Updated: $file" -ForegroundColor Green
        } else {
            Write-Host "Skip (no 'use client'): $file" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nDone!"
