# Remove duplicate MainLayout wrappers from dashboard pages
$ErrorActionPreference = "Stop"

Write-Host "Removing duplicate MainLayout wrappers from dashboard pages..." -ForegroundColor Cyan

# Get all page.tsx files in dashboard subdirectories (excluding main dashboard/page.tsx)
$files = Get-ChildItem -Path "d:\UniqBrio\app\dashboard" -Filter "page.tsx" -Recurse -File | 
    Where-Object { $_.FullName -ne "d:\UniqBrio\app\dashboard\page.tsx" }

$updateCount = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    
    # Check if file imports MainLayout
    if ($content -match 'import\s+MainLayout\s+from\s+[''"]@/components/(dashboard/)?main-layout[''"]') {
        Write-Host "  Processing: $($file.FullName)" -ForegroundColor Yellow
        
        # Remove the import statement
        $content = $content -replace 'import\s+MainLayout\s+from\s+[''"]@/components/(dashboard/)?main-layout[''"]\s*\n?', ''
        
        # Remove MainLayout wrapper - handle different patterns
        # Pattern 1: <MainLayout>\n  {content}\n</MainLayout>
        $content = $content -replace '(\s*)<MainLayout>\s*\n\s*', '$1'
        $content = $content -replace '\s*</MainLayout>\s*\n?\s*\)', ')'
        
        # Pattern 2: return (<MainLayout>...</MainLayout>)
        $content = $content -replace 'return\s*\(\s*<MainLayout>\s*', 'return ('
        $content = $content -replace '</MainLayout>\s*\)', ')'
        
        # Pattern 3: return <MainLayout>...</MainLayout>
        $content = $content -replace 'return\s+<MainLayout>\s*', 'return <>'
        $content = $content -replace '</MainLayout>', '</>'
        
        if ($content -ne $originalContent) {
            # Write back with UTF-8 no-BOM encoding
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
            Write-Host "    Updated: $($file.FullName)" -ForegroundColor Green
            $updateCount++
        }
    }
}

Write-Host "`nUpdated $updateCount files" -ForegroundColor Cyan
Write-Host "All dashboard pages now use the layout from dashboard/layout.tsx" -ForegroundColor Green
