$root = "c:\Users\Usuario\Downloads\Clinikdent_supabase_Ult"
Write-Output "Searching for files with 'test' in name under $root (excluding Backend/, archive_tests/, Clinikdent_supabase_1.0/, node_modules/, .git/)"
$files = Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    ($_.Name -match '(?i)test') -and
    ($_.FullName -notmatch '\\Backend\\') -and
    ($_.FullName -notmatch '\\archive_tests\\') -and
    ($_.FullName -notmatch '\\Clinikdent_supabase_1.0\\') -and
    ($_.FullName -notmatch '\\node_modules\\') -and
    ($_.FullName -notmatch '\\\.git\\')
}

if (-not $files) {
    Write-Output "No candidate files found."
    exit 0
}

$moved = @()
foreach ($f in $files) {
    $rel = $f.FullName.Substring($root.Length+1) -replace '\\','/'
    $target = Join-Path $root ('archive_tests\\moved_safe\\' + $rel)
    $tDir = Split-Path $target
    if (-not (Test-Path $tDir)) { New-Item -ItemType Directory -Path $tDir -Force | Out-Null }
    Write-Output "Processing: $rel"
    # Only move typical project files (exclude node_modules, .git already)
    # If file is tracked, use git mv to preserve history
    & git -C $root ls-files --error-unmatch $rel 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Output "  -> tracked: git mv $rel archive_tests/moved_safe/$rel"
        & git -C $root mv $rel ("archive_tests/moved_safe/" + $rel)
    } else {
        Write-Output "  -> untracked: moving file to archive and git add"
        Move-Item -LiteralPath $f.FullName -Destination $target -Force
        & git -C $root add ("archive_tests/moved_safe/" + $rel) 2>$null
    }
    $moved += $rel
}

$moved | Out-File -FilePath (Join-Path $root 'archive_tests\\moved_safe_list.txt') -Encoding utf8
Write-Output "Done. Moved $($moved.Count) files. See archive_tests/moved_safe_list.txt"
