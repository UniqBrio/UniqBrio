# Script to fix @/components/ui/ imports to @/components/dashboard/ui/ in dashboard folder

$files = Get-ChildItem -Path "d:\UniqBrio\components\dashboard" -Recurse -Include *.tsx,*.ts

$count = 0
$skipped = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    
    # Replace @/components/ui/ with @/components/dashboard/ui/
    $content = $content -replace 'from\s+"@/components/ui/', 'from "@/components/dashboard/ui/'
    $content = $content -replace "from\s+'@/components/ui/", "from '@/components/dashboard/ui/"
    $content = $content -replace '} from "@/components/ui/', '} from "@/components/dashboard/ui/'
    $content = $content -replace "} from '@/components/ui/", "} from '@/components/dashboard/ui/"
    
    if ($content -ne $originalContent) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
        $count++
    } else {
        $skipped++
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Fixed: $count files" -ForegroundColor Green
Write-Host "  Skipped: $skipped files" -ForegroundColor Yellow
Write-Host "Done!" -ForegroundColor Cyan
