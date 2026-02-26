$b = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Branch: $b"
git add start-backend.bat start-frontend.bat start-all.bat
try {
    git commit -m "Run services in background (no new windows) and redirect logs; add optional interactive pause"
} catch {
    Write-Host "No changes to commit or commit failed: $_"
}
git push --force origin $b
