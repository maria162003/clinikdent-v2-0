$root = "c:\Users\Usuario\Downloads\Clinikdent_supabase_Ult"

Write-Output "Searching for files with 'test' in name under $root (excluding Backend/, archive_tests/, Clinikdent_supabase_1.0/)"
$files = Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match 'test' -and $_.FullName -notmatch '\\Backend\\' -and $_.FullName -notmatch '\\archive_tests\\' -and $_.FullName -notmatch '\\Clinikdent_supabase_1.0\\'
}

if (-not $files) {
    Write-Output "No candidate files found."
    exit 0
}

$moved = @()
foreach ($f in $files) {
    # Relative path from repo root, using forward slashes for git
    $rel = $f.FullName.Substring($root.Length+1) -replace '\\','/'
    $target = Join-Path $root ('archive_tests\\moved\\' + $rel)
    $tDir = Split-Path $target
    if (-not (Test-Path $tDir)) { New-Item -ItemType Directory -Path $tDir -Force | Out-Null }
    Write-Output "Processing: $rel"
    # Check if tracked
    & git -C $root ls-files --error-unmatch $rel 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Output "  -> tracked: git mv $rel archive_tests/moved/$rel"
        & git -C $root mv $rel ("archive_tests/moved/" + $rel)
    } else {
        Write-Output "  -> untracked: moving file to archive and git add"
        Move-Item -LiteralPath $f.FullName -Destination $target -Force
        & git -C $root add ("archive_tests/moved/" + $rel) 2>$null
    }
    $moved += $rel
}

$moved | Out-File -FilePath (Join-Path $root 'archive_tests\\moved_list.txt') -Encoding utf8
Write-Output "Done. Moved $($moved.Count) files. See archive_tests/moved_list.txt"
