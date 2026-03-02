#!/bin/bash
set -e

echo "=== Installing Rust ==="
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version
echo "✅ Rust installed"

echo ""
echo "=== Installing Solana CLI ==="
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.11/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
echo "✅ Solana CLI installed"

echo ""
echo "=== Installing Anchor CLI ==="
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli
anchor --version
echo "✅ Anchor CLI installed"

echo ""
echo "=== ALL TOOLS INSTALLED ==="
rustc --version
solana --version
anchor --version
