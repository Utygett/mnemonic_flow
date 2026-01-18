$SrcDir  = "src"
$Output  = "listing.txt"

$ExcludePathParts = @("\.venv\", "\__pycache__\", "\node_modules\")
$ExcludeFilePatterns = @("*.pyc", "*.log", "*.md*", "*.css*")

Set-Content -Path $Output -Value "" -Encoding utf8  # очистить файл [web:334]

Get-ChildItem -Path $SrcDir -Recurse -File | Where-Object {
    $full = $_.FullName
    foreach ($p in $ExcludePathParts) { if ($full -like "*$p*") { return $false } }
    foreach ($pat in $ExcludeFilePatterns) { if ($_.Name -like $pat) { return $false } }
    return $true
} | ForEach-Object {
    Add-Content -Path $Output -Value "==============================" -Encoding utf8
    Add-Content -Path $Output -Value ("FILE: " + $_.FullName) -Encoding utf8
    Add-Content -Path $Output -Value "==============================" -Encoding utf8
    Add-Content -Path $Output -Value "" -Encoding utf8

    # ВАЖНО: читаем исходники как UTF-8
    Get-Content -Path $_.FullName -Raw -Encoding utf8 |
      Add-Content -Path $Output -Encoding utf8  # дописываем [web:346]

    Add-Content -Path $Output -Value "`n`n" -Encoding utf8
}
