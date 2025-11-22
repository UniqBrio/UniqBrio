# PowerShell script to replace all connectDB, connectMongo, and connectToDatabase calls with dbConnect

$patterns = @(
    @{ Old = '\bconnectDB\s*\('; New = 'dbConnect(' },
    @{ Old = '\bconnectMongo\s*\('; New = 'dbConnect(' },
    @{ Old = '\bconnectToDatabase\s*\('; New = 'dbConnect(' }
)

# Get all TypeScript files in app/api
$files = Get-ChildItem -Path "d:\UniqBrio\app\api" -Filter "*.ts" -Recurse -File

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

Write-Host "`nTotal files fixed: $totalFixed" -ForegroundColor Cyan
