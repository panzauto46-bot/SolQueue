param(
    [string]$WalletPath = "C:/solana-keys/id.json",
    [string]$ProgramKeypairPath = "target/deploy/solqueue-keypair.json",
    [string]$ProgramName = "solqueue",
    [double]$MinimumSol = 2.25
)

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $name"
    }
}

function Get-BalanceSol($walletPath) {
    $raw = solana balance --url devnet $walletPath 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to read wallet balance: $raw"
    }

    if ($raw -match "([0-9]+(?:\.[0-9]+)?)\s+SOL") {
        return [double]$Matches[1]
    }

    throw "Unexpected balance output: $raw"
}

Assert-Command "solana"
Assert-Command "anchor"
Assert-Command "solana-keygen"

if (-not (Test-Path $WalletPath)) {
    throw "Wallet not found: $WalletPath"
}

if (-not (Test-Path $ProgramKeypairPath)) {
    throw "Program keypair not found: $ProgramKeypairPath"
}

$walletPubkey = solana-keygen pubkey $WalletPath
$programPubkey = solana-keygen pubkey $ProgramKeypairPath
$balance = Get-BalanceSol $WalletPath

Write-Host "Wallet        : $walletPubkey"
Write-Host "Program ID    : $programPubkey"
Write-Host "Devnet Balance: $balance SOL"

if ($balance -lt $MinimumSol) {
    Write-Host ""
    Write-Host "Insufficient balance for deploy."
    Write-Host "Minimum recommended: $MinimumSol SOL"
    Write-Host "Try funding wallet, then rerun this script."
    Write-Host "Example: solana airdrop 2 $walletPubkey --url devnet"
    exit 1
}

anchor deploy `
    -p $ProgramName `
    --program-keypair $ProgramKeypairPath `
    --provider.cluster devnet `
    --provider.wallet $WalletPath

if ($LASTEXITCODE -ne 0) {
    throw "Deploy failed."
}

Write-Host ""
Write-Host "Deploy success."
Write-Host "Program ID: $programPubkey"
Write-Host "Explorer  : https://explorer.solana.com/address/$programPubkey?cluster=devnet"
