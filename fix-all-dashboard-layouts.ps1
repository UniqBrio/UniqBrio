$ErrorActionPreference = "Stop"
Write-Host "Fixing all dashboard pages..." -ForegroundColor Cyan
$files = Get-ChildItem -Path "d:\UniqBrio\app\dashboard" -Filter "page.tsx" -Recurse -File | Where-Object { $_.FullName -ne "d:\UniqBrio\app\dashboard\page.tsx" }
$fixedCount = 0
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        if ($content -match 'MainLayout') {
            Write-Host "Processing: $($file.FullName)" -ForegroundColor Yellow
            $content = $content -replace 'import\s+MainLayout\s+from\s+[''"]@/components/(dashboard/)?main-layout[''"]\s*\r?\n?', ''
            $content = $content -replace '<MainLayout>\s*\r?\n?', ''
            $content = $content -replace '\s*</MainLayout>\s*\r?\n?', ''
            if ($content -ne $originalContent) {
                $utf8NoBom = New-Object System.Text.UTF8Encoding $false
                [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
                Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
                $fixedCount++
            }
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}
Write-Host "Fixed $fixedCount pages" -ForegroundColor Green
