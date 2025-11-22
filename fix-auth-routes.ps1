# Fix auth-related routes to use dbConnectAuth()
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

$authRoutes = @(
    "app\api\debug-registrations\route.ts",
    "app\api\admin-auth\route.ts",
    "app\api\admin-data\route.ts",
    "app\api\auth-debug\route.ts",
    "app\api\test-auth-api\route.ts",
    "app\api\test-kyc-auth\route.ts",
    "app\api\test-user-academy\route.ts",
    "app\api\debug-users\route.ts",
    "app\api\list-collections\route.ts",
    "app\api\raw-registrations\route.ts",
    "app\api\test\route.ts"
)

$count = 0

Write-Host "Updating auth routes to use dbConnectAuth()..." -ForegroundColor Cyan

foreach ($route in $authRoutes) {
    $filePath = Join-Path $scriptPath $route
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Replace import statement
        $content = $content -replace "import \{ dbConnect \} from ['`"]@/lib/mongodb['`"];?", "import { dbConnectAuth } from '@/lib/mongodb';"
        
        # Replace function calls
        $content = $content -replace "\bdbConnect\(\)", "dbConnectAuth()"
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($filePath, $content, [System.Text.UTF8Encoding]::new($false))
            Write-Host "Fixed: $filePath" -ForegroundColor Green
            $count++
        }
    }
}

Write-Host "`nTotal auth routes fixed: $count" -ForegroundColor Green
Write-Host "Done!" -ForegroundColor Cyan
