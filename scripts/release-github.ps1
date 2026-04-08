# Crea commit + etiqueta semver y opcionalmente hace push a origin (GitHub).
# Uso:
#   .\scripts\release-github.ps1
#   .\scripts\release-github.ps1 -Push
#   .\scripts\release-github.ps1 -Semver 0.3.0 -Push

param(
  [string] $Semver = "0.2.0",
  [switch] $Push
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

$tag = "v$Semver"
$branch = (git branch --show-current).Trim()
if (-not $branch) { throw "No se detecto la rama actual." }

Write-Host ">> Raiz: $Root"
Write-Host ">> Rama: $branch  |  Version: $Semver  |  Tag: $tag"

npm version $Semver --no-git-tag-version
if ($LASTEXITCODE -ne 0) { throw "npm version fallo." }

git add -A
$status = git status --short
if (-not $status) {
  Write-Host "No hay cambios para commitear."
  exit 0
}

git commit -m "release: v$Semver - cronograma, servicios y UI" -m "Servicio: duracionMinutos, API, calendario; formulario 4+4; MUI time picker; layout ancho; fixes borrado/duplicados."

git tag -a $tag -m "Version $Semver"

Write-Host ""
Write-Host "Listo: commit y tag $tag en $branch."
if (-not $Push) {
  Write-Host "Para subir a GitHub:"
  Write-Host "  git push origin $branch"
  Write-Host "  git push origin $tag"
  exit 0
}

git push origin $branch
git push origin $tag
Write-Host "Push completado."
