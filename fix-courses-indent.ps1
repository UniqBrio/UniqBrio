# Fix courses route indentation
# Lines 445-780 need to go from 4 spaces to 8 spaces (they're inside try block)

$file = "d:\UniqBrio\app\api\dashboard\services\courses\route.ts"
$lines = Get-Content $file

$fixed = for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Lines 444-780 (0-indexed: 443-779) that start with exactly 4 spaces need +4 spaces
    # But skip lines that already have more than 4 spaces or are blank
    if ($i -ge 443 -and $i -le 779) {
        if ($line -match '^    [^ ]') {
            # Line has exactly 4 spaces followed by non-space - add 4 more
            '    ' + $line
        } else {
            $line
        }
    } else {
        $line
    }
}

$fixed | Set-Content $file -NoNewline
Write-Host "Fixed courses route indentation"
