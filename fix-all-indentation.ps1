# Fix indentation issues in route files where async () => { callbacks have improperly indented code

$files = @(
    "d:\UniqBrio\app\api\dashboard\payments\analytics\route.ts",
    "d:\UniqBrio\app\api\dashboard\payments\all-students\route.ts",
    "d:\UniqBrio\app\api\dashboard\payments\course-summary\route.ts",
    "d:\UniqBrio\app\api\dashboard\student\students\route.ts",
    "d:\UniqBrio\app\api\dashboard\financial\route.ts",
    "d:\UniqBrio\app\api\dashboard\financial\incomedrafts\route.ts",
    "d:\UniqBrio\app\api\dashboard\financial\expensedrafts\route.ts"
)

foreach ($file in $files) {
    Write-Host "Processing: $file"
   
    # Read file
    $content = Get-Content $file -Raw
    
    # Strategy: Find `async () => {` followed by code that's only 2-space indented
    # These should be 6-space indented (inside the async callback)
    
    # Replace pattern: lines starting with exactly 2 spaces after `async () => {`
    # Should become 6 spaces
    
    # Pattern 1: `async () => {\n  await` -> `async () => {\n      await`
    $content = $content -replace '(?m)(async \(\) => \{\r?\n)(  )([^ ])', '$1      $3'
    
    # Pattern 2: `async () => {\n  try` -> `async () => {\n      try`
    $content = $content -replace '(?m)(async \(\) => \{\r?\n)(  )(try \{)', '$1      $3'
    
    # Pattern 3: Lines with exactly 4 spaces after queries that should be 8 spaces
    # (code inside try block that's improperly indented)
    # This is trickier - need context-aware replacement
    
    # For now, do line-by-line processing
    $lines = $content -split "`r?`n"
    $fixed = @()
    $insideAsyncCallback = $false
    $asyncIndentLevel = 0
    $bracketCount = 0
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Detect async () => {
        if ($line -match '^\s*async \(\) => \{$') {
            $asyncIndentLevel = ($line -replace '\S.*$', '').Length
            $insideAsyncCallback = $true
            $bracketCount = 1
            $fixed += $line
            continue
        }
        
        # Track bracket depth
        if ($insideAsyncCallback) {
            $openBrackets = ([regex]::Matches($line, '\{')).Count
            $closeBrackets = ([regex]::Matches($line, '\}')).Count
            $bracketCount += ($openBrackets - $closeBrackets)
            
            # If we're back to 0, we've closed the async callback
            if ($bracketCount -le 0) {
                $insideAsyncCallback = $false
                $fixed += $line
                continue
            }
            
            # If line starts with exactly (asyncIndentLevel + 2) spaces, add 4 more
            $currentIndent = ($line -replace '\S.*$', '').Length
            if ($currentIndent -eq ($asyncIndentLevel + 2) -and $line -match '^\s+\S') {
                $fixed += '    ' + $line
                continue
            }
        }
        
        $fixed += $line
    }
    
    # Write back
    $fixed -join "`n" | Set-Content $file -NoNewline
    
    Write-Host "  DONE"
}

Write-Host "`nAll files processed!"
