param(
  [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$bundledNodePath = Join-Path $repoRoot ".tools\node-v24.14.1-win-x64\node.exe"
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue

if (Test-Path -LiteralPath $bundledNodePath) {
  $nodePath = $bundledNodePath
}
elseif ($nodeCommand) {
  $nodePath = $nodeCommand.Source
}
else {
  throw "Node.js was not found. Install Node.js or restore the bundled runtime under .tools\\node-v24.14.1-win-x64\\."
}

function Invoke-NodeCli {
  param(
    [string]$CliRelativePath,
    [string[]]$Arguments
  )

  $cliPath = Join-Path $repoRoot $CliRelativePath
  if (-not (Test-Path -LiteralPath $cliPath)) {
    throw "Required CLI entrypoint not found at $cliPath. Run npm install first."
  }

  Write-Host (">> {0} {1} {2}" -f $nodePath, $CliRelativePath, ($Arguments -join " ")) -ForegroundColor Cyan
  & $nodePath $cliPath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed for $CliRelativePath with exit code $LASTEXITCODE."
  }
}

Push-Location $repoRoot
try {
  Invoke-NodeCli -CliRelativePath "node_modules\eslint\bin\eslint.js" -Arguments @(".")
  Invoke-NodeCli -CliRelativePath "node_modules\next\dist\bin\next" -Arguments @("typegen")
  Invoke-NodeCli -CliRelativePath "node_modules\typescript\bin\tsc" -Arguments @("--noEmit")

  if (-not $SkipBuild) {
    Invoke-NodeCli -CliRelativePath "node_modules\next\dist\bin\next" -Arguments @("build", "--webpack")
  }
}
finally {
  Pop-Location
}
