$existing = git remote 2>$null
if ($existing -contains "domsite") {
    git remote remove domsite
}

git remote add domsite "https://github.com/FilSmirnov/domsite.git"
if ($LASTEXITCODE -ne 0) { Write-Output "REMOTE_ADD_FAILED"; exit 1 }

git add -A
git commit -m "feat: admin panel (orders, users, banners, pages, seo redirects), role-based access, proxy.ts"

git push domsite main:main
if ($LASTEXITCODE -ne 0) { Write-Output "PUSH_FAILED"; exit 1 }

Write-Output "PUSH_OK"
