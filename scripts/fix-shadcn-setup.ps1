#!/usr/bin/env pwsh
# Shadcn/UI Setup Fix Script
# Run this if you encounter "shadcn/ui setup not configured properly" errors

Write-Host "🔧 Shadcn/UI Setup Fix Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify dependencies
Write-Host "✓ Step 1: Verifying dependencies..." -ForegroundColor Yellow
$hasClsx = npm list clsx 2>$null
$hasTailwindMerge = npm list tailwind-merge 2>$null

if ($hasClsx -and $hasTailwindMerge) {
    Write-Host "  ✓ clsx and tailwind-merge are installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Installing missing dependencies..." -ForegroundColor Red
    npm install clsx tailwind-merge
}

# Step 2: Test cn utility
Write-Host ""
Write-Host "✓ Step 2: Testing cn() utility..." -ForegroundColor Yellow
$testResult = npx tsx lib/test-cn.ts 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ cn() utility is working correctly" -ForegroundColor Green
} else {
    Write-Host "  ✗ cn() utility test failed" -ForegroundColor Red
    Write-Host "  Error: $testResult" -ForegroundColor Red
}

# Step 3: Clear caches
Write-Host ""
Write-Host "✓ Step 3: Clearing caches..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "  ✓ Cleared .next cache" -ForegroundColor Green
}
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "  ✓ Cleared node_modules cache" -ForegroundColor Green
}

# Step 4: Instructions for VS Code
Write-Host ""
Write-Host "✓ Step 4: VS Code TypeScript Server Reset" -ForegroundColor Yellow
Write-Host "  Please manually restart the TypeScript server in VS Code:" -ForegroundColor White
Write-Host "  1. Press Ctrl+Shift+P" -ForegroundColor White
Write-Host "  2. Type: TypeScript: Restart TS Server" -ForegroundColor White
Write-Host "  3. Press Enter" -ForegroundColor White

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "If errors persist:" -ForegroundColor Yellow
Write-Host "  • Reload VS Code window (Ctrl+Shift+P > Developer: Reload Window)" -ForegroundColor White
Write-Host "  • Check SHADCN_SETUP_VERIFICATION.md for detailed troubleshooting" -ForegroundColor White
Write-Host ""
