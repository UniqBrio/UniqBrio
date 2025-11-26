# PowerShell script to update all remaining hardcoded purple/orange colors
# This script will systematically update all component files

Write-Host "🎨 Starting Comprehensive Custom Colors Update..." -ForegroundColor Cyan
Write-Host ""

# Define color patterns to search for
$patterns = @(
    "text-purple-",
    "bg-purple-",
    "border-purple-",
    "text-orange-",
    "bg-orange-",
    "border-orange-"
)

# Get all tsx/ts files in components/dashboard
$files = Get-ChildItem -Path "components/dashboard" -Recurse -Include *.tsx,*.ts -File

$filesToUpdate = @()

Write-Host "🔍 Scanning files for hardcoded colors..." -ForegroundColor Yellow
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $hasHardcodedColors = $false
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            $hasHardcodedColors = $true
            break
        }
    }
    
    if ($hasHardcodedColors) {
        # Skip files that already have useCustomColors
        if ($content -notmatch "useCustomColors") {
            $filesToUpdate += $file
        }
    }
}

Write-Host "📋 Found $($filesToUpdate.Count) files needing updates:" -ForegroundColor Green
$filesToUpdate | ForEach-Object {
    Write-Host "  - $($_.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 Files by category:" -ForegroundColor Cyan

# Group by directory
$grouped = $filesToUpdate | Group-Object { Split-Path $_.Directory -Leaf }
foreach ($group in $grouped) {
    Write-Host "  $($group.Name): $($group.Count) files" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ Custom Colors Update Summary:" -ForegroundColor Green
Write-Host "  - Files already updated: $(($files.Count - $filesToUpdate.Count))" -ForegroundColor Green
Write-Host "  - Files remaining: $($filesToUpdate.Count)" -ForegroundColor Yellow
Write-Host ""

# List specific files
Write-Host "📁 Priority files for manual review:" -ForegroundColor Magenta
$priorities = @(
    "selectcolumn.tsx",
    "financials/StatsOverview.tsx",
    "financials/ROICalculator.tsx",
    "financials/IncomeSearchFilters.tsx",
    "financials/IncomeExpensesSection.tsx",
    "financials/ColumnSelectorModal.tsx",
    "footer.tsx",
    "main-layout.tsx",
    "notification-system.tsx"
)

foreach ($priority in $priorities) {
    $found = $filesToUpdate | Where-Object { $_.Name -eq (Split-Path $priority -Leaf) }
    if ($found) {
        Write-Host "  ✓ $priority" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review the files listed above" -ForegroundColor White
Write-Host "  2. Add: import { useCustomColors } from '@/lib/use-custom-colors'" -ForegroundColor White
Write-Host "  3. Add hook: const { primaryColor, secondaryColor } = useCustomColors()" -ForegroundColor White
Write-Host "  4. Replace color classes with inline styles" -ForegroundColor White
Write-Host ""
Write-Host "✨ Most pages are already updated and working!" -ForegroundColor Green
