# Fix indentation issue: change "async () => {\n  try {" to "async () => {\n      try {"
# This ensures try blocks are properly inside async callbacks for AsyncLocalStorage

$files = @(
    "app\api\dashboard\events\route.ts",
    "app\api\dashboard\notifications\route.ts",
    "app\api\dashboard\task-management\tasks\route.ts",
    "app\api\dashboard\staff\dashboard\stats\route.ts",
    "app\api\dashboard\student\attendance-drafts\route.ts",
    "app\api\dashboard\student\attendance\route.ts",
    "app\api\dashboard\staff\instructor\instructors(leave)\route.ts",
    "app\api\dashboard\payments\manual\route.ts",
    "app\api\dashboard\payments\route.ts",
    "app\api\dashboard\payments\non-instructors\route.ts",
    "app\api\dashboard\payments\payment-records\route.ts",
    "app\api\dashboard\payments\monthly-subscriptions\route.ts",
    "app\api\dashboard\services\courses\route.ts",
    "app\api\dashboard\payments\instructors\route.ts",
    "app\api\dashboard\payments\create-for-student\route.ts",
    "app\api\dashboard\services\cohorts\route.ts",
    "app\api\dashboard\services\schedules\route.ts",
    "app\api\dashboard\financial\route.ts",
    "app\api\dashboard\financial\expensedrafts\[id]\route.ts",
    "app\api\dashboard\financial\incomedrafts\[id]\route.ts"
)

$fixedCount = 0

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $filePath) {
        Write-Host "Processing: $file"
        
        $content = Get-Content $filePath -Raw
        $originalContent = $content
        
        # Fix the pattern: replace "async () => {\n  try {" with "async () => {\n      try {"
        $content = $content -replace '(?m)^(\s*)async \(\) => \{\r?\n  try \{', '$1async () => {$2      try {'
        
        if ($content -ne $originalContent) {
            Set-Content $filePath -Value $content -NoNewline
            Write-Host "  ✓ Fixed indentation" -ForegroundColor Green
            $fixedCount++
        } else {
            Write-Host "  - No changes needed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ! File not found" -ForegroundColor Red
    }
}

Write-Host "`n✓ Fixed $fixedCount files" -ForegroundColor Green
Write-Host "Please restart your dev server for changes to take effect."
