## Cara Deploy SolQueue ke Devnet

### Prerequisite
- Solana CLI terinstall (`solana --version`)
- Anchor CLI terinstall (`anchor --version`)
- Keypair sudah ada (`solana address`)

### Step 1: Airdrop SOL (butuh minimal 3 SOL)
```bash
# Coba CLI dulu
solana airdrop 2 --url devnet

# Kalau rate limited, pakai browser:
# https://faucet.solana.com/ (connect GitHub untuk limit lebih tinggi)
# Limit: 2 request per 8 jam
```

### Step 2: Cek Balance
```bash
solana balance --url devnet
```

### Step 3: Build (kalau belum)
```bash
# Di Windows, set HOME dulu:
$env:HOME = $env:USERPROFILE
anchor build --no-idl

# Atau via WSL:
wsl -d Ubuntu -- bash -lc 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH" && cd /mnt/c/Users/PANZ\ AUTO/Documents/SolQueue && anchor build --no-idl'
```
> Gunakan `--no-idl` untuk menghindari issue kompatibilitas IDL host build pada kombinasi Rust/Anchor tertentu.

### Step 4: Deploy
```bash
solana program deploy target/deploy/solqueue.so \
  --program-id target/deploy/solqueue-keypair.json \
  --url devnet
```

### Step 5: Update Program ID
Setelah deploy, update Program ID di:
1. `programs/solqueue/src/lib.rs` → `declare_id!("NEW_ID")`
2. `Anchor.toml` → `solqueue = "NEW_ID"`

### Step 6: Rebuild & Redeploy
```bash
anchor build
anchor deploy --provider.cluster devnet
```

### Step 7: Verify
```bash
solana program show GHrFSFPtew8KtV8SCYSDd4GEp5BeGGSuVXXumZ2Ptm64 --url devnet
```
