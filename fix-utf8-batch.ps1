$files = @(
    "d:\UniqBrio\app\dashboard\page.tsx"
)

foreach ($file in $files) {
    Write-Host "Processing: $file"
    try {
        # Read with UTF-8 encoding
        $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
        
        # Remove null bytes
        $cleaned = $content -replace "`0", ""
        
        # Write back with UTF-8 encoding (without BOM)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file, $cleaned, $utf8NoBom)
        
        Write-Host "Fixed: $file" -ForegroundColor Green
    }
    catch {
        Write-Host "Error processing $file : $_" -ForegroundColor Red
    }
}

Write-Host "All files processed!"
