/**
 * SolQueue Wallet Adapter — Multi-wallet support for Solana
 * 
 * Supports: Phantom, Solflare, Backpack, Bitget, Coin98, Trust,
 * OKX, Coinbase, and any Standard Wallet API compatible wallet
 */

import {
    SolQueueClient,
    shortenAddress,
    DEVNET_RPC
} from '../sdk/index.js';
import { Connection } from '@solana/web3.js';

// ═══════════════════════════════════════════════
//  SUPPORTED WALLETS REGISTRY
// ═══════════════════════════════════════════════

const WALLET_CONFIGS = [
    {
        id: 'phantom',
        name: 'Phantom',
        icon: '👻',
        color: '#ab9ff2',
        url: 'https://phantom.app/',
        detect: () => window.phantom?.solana?.isPhantom || window.solana?.isPhantom,
        getProvider: () => window.phantom?.solana || window.solana,
    },
    {
        id: 'solflare',
        name: 'Solflare',
        icon: '🔆',
        color: '#fc7227',
        url: 'https://solflare.com/',
        detect: () => window.solflare?.isSolflare,
        getProvider: () => window.solflare,
    },
    {
        id: 'backpack',
        name: 'Backpack',
        icon: '🎒',
        color: '#e33e3f',
        url: 'https://backpack.app/',
        detect: () => window.backpack?.isBackpack,
        getProvider: () => window.backpack,
    },
    {
        id: 'bitget',
        name: 'Bitget Wallet',
        icon: '💎',
        color: '#00d4aa',
        url: 'https://web3.bitget.com/',
        detect: () => window.bitkeep?.solana || window.bitget?.solana,
        getProvider: () => window.bitkeep?.solana || window.bitget?.solana,
    },
    {
        id: 'coin98',
        name: 'Coin98',
        icon: '🪙',
        color: '#d9b432',
        url: 'https://coin98.com/',
        detect: () => window.coin98?.sol,
        getProvider: () => window.coin98?.sol,
    },
    {
        id: 'okx',
        name: 'OKX Wallet',
        icon: '⭕',
        color: '#ffffff',
        url: 'https://www.okx.com/web3',
        detect: () => window.okxwallet?.solana,
        getProvider: () => window.okxwallet?.solana,
    },
    {
        id: 'trust',
        name: 'Trust Wallet',
        icon: '🛡️',
        color: '#3375BB',
        url: 'https://trustwallet.com/',
        detect: () => window.trustwallet?.solana,
        getProvider: () => window.trustwallet?.solana,
    },
    {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: '🔵',
        color: '#0052ff',
        url: 'https://www.coinbase.com/wallet',
        detect: () => window.coinbaseSolana,
        getProvider: () => window.coinbaseSolana,
    },
];

// ═══════════════════════════════════════════════
//  WALLET STATE
// ═══════════════════════════════════════════════

let walletState = {
    connected: false,
    publicKey: null,
    balance: 0,
    client: null,
    walletName: null,
    walletIcon: null,
    provider: null,
    listeners: [],
};

export function getWalletState() {
    return { ...walletState };
}

export function getClient() {
    return walletState.client;
}

export function onWalletChange(callback) {
    walletState.listeners.push(callback);
    return () => {
        walletState.listeners = walletState.listeners.filter(l => l !== callback);
    };
}

function notifyListeners() {
    walletState.listeners.forEach(cb => cb({ ...walletState }));
}

// ═══════════════════════════════════════════════
//  WALLET DETECTION
// ═══════════════════════════════════════════════

/**
 * Detect which Solana wallets are installed
 * @returns {Array} List of detected wallet configs
 */
export function detectWallets() {
    // Wait a tick so wallet extensions can inject
    return WALLET_CONFIGS.filter(w => {
        try { return w.detect(); }
        catch { return false; }
    });
}

/**
 * Get all wallet configs (installed + not installed)
 */
export function getAllWallets() {
    return WALLET_CONFIGS.map(w => ({
        ...w,
        installed: (() => { try { return !!w.detect(); } catch { return false; } })(),
    }));
}

// ═══════════════════════════════════════════════
//  CONNECT / DISCONNECT
// ═══════════════════════════════════════════════

/**
 * Connect to a specific wallet by ID
 * @param {string} walletId - Wallet ID from WALLET_CONFIGS
 */
export async function connectWallet(walletId) {
    // If no walletId specified, show picker
    if (!walletId) {
        return showWalletPicker();
    }

    const walletConfig = WALLET_CONFIGS.find(w => w.id === walletId);
    if (!walletConfig) {
        showToast('Unknown wallet', 'error');
        throw new Error(`Unknown wallet: ${walletId}`);
    }

    if (!walletConfig.detect()) {
        // Not installed — open install page
        window.open(walletConfig.url, '_blank');
        showToast(`Please install ${walletConfig.name} and refresh`, 'info', 5000);
        throw new Error(`${walletConfig.name} not installed`);
    }

    try {
        const provider = walletConfig.getProvider();

        // Hide picker overlay so wallet extension popup is not blocked
        const overlay = document.getElementById('wallet-picker-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }

        const response = await provider.connect();
        // Different wallets return publicKey differently
        const publicKey = response?.publicKey || provider.publicKey;

        if (!publicKey) {
            throw new Error('Wallet did not return a public key');
        }

        const connection = new Connection(DEVNET_RPC, 'confirmed');
        const wallet = {
            publicKey,
            signTransaction: (tx) => provider.signTransaction(tx),
            signAllTransactions: (txs) => provider.signAllTransactions?.(txs) || Promise.all(txs.map(t => provider.signTransaction(t))),
        };

        const client = new SolQueueClient(connection, wallet);
        let balance = 0;
        try { balance = await connection.getBalance(publicKey); } catch { }

        walletState = {
            connected: true,
            publicKey: publicKey.toString(),
            balance: balance / 1e9,
            client,
            walletName: walletConfig.name,
            walletIcon: walletConfig.icon,
            provider,
            listeners: walletState.listeners,
        };

        // Save last used wallet
        try { localStorage.setItem('solqueue_wallet', walletId); } catch { }

        notifyListeners();
        updateWalletUI();
        closeWalletPicker();

        // Directly update dashboard wallet UI elements
        updateDashboardWalletUI(walletState);

        showToast(`${walletConfig.name} connected!`, 'success');

        return client;
    } catch (error) {
        // Re-show picker so user can try another wallet
        const overlay = document.getElementById('wallet-picker-overlay');
        if (overlay) {
            overlay.style.opacity = '';
            overlay.style.pointerEvents = '';
        }
        if (error.message?.includes('User rejected')) {
            showToast('Connection cancelled', 'info');
        } else {
            showToast(`Connection failed: ${error.message}`, 'error');
        }
        throw error;
    }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet() {
    try {
        if (walletState.provider?.disconnect) {
            await walletState.provider.disconnect();
        }
        if (walletState.client) {
            await walletState.client.unsubscribeAll();
        }
    } catch (e) {
        console.error('Disconnect error:', e);
    }

    try { localStorage.removeItem('solqueue_wallet'); } catch { }

    walletState = {
        connected: false,
        publicKey: null,
        balance: 0,
        client: null,
        walletName: null,
        walletIcon: null,
        provider: null,
        listeners: walletState.listeners,
    };

    notifyListeners();
    updateWalletUI();
    updateDashboardWalletUI(walletState);
}

/**
 * Refresh wallet balance
 */
export async function refreshBalance() {
    if (!walletState.connected || !walletState.client) return;
    try {
        const balance = await walletState.client.connection.getBalance(
            walletState.client.wallet.publicKey
        );
        walletState.balance = balance / 1e9;
        notifyListeners();
        updateWalletUI();
    } catch (e) {
        console.error('Balance refresh failed:', e);
    }
}

/**
 * Update dashboard-specific wallet UI (sidebar + header)
 * This runs without page re-render
 */
export function updateDashboardWalletUI(state) {
    const addr = state.publicKey;
    const short = addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '';
    const icon = state.walletIcon || '🔗';
    const name = state.walletName || 'Wallet';

    // Update sidebar wallet area
    const sidebarWallet = document.getElementById('sidebar-wallet-area');
    if (sidebarWallet) {
        if (state.connected) {
            sidebarWallet.innerHTML = `
                <div class="wallet-avatar" style="color:#14F195;">◉</div>
                <div class="wallet-info">
                    <div class="wallet-label" style="color:#14F195;">${name}</div>
                    <div class="wallet-address">${short}</div>
                </div>
                <div class="wallet-status" style="background:#14F195;"></div>
            `;
        } else {
            sidebarWallet.innerHTML = `
                <div class="wallet-avatar">◎</div>
                <div class="wallet-info">
                    <div class="wallet-label">Not Connected</div>
                    <div class="wallet-address" style="color:var(--text-tertiary);">Click to connect</div>
                </div>
                <div class="wallet-status" style="background:var(--text-muted);"></div>
            `;
        }
    }

    // Update header wallet button
    const headerBtn = document.getElementById('header-wallet-btn');
    if (headerBtn) {
        if (state.connected) {
            headerBtn.innerHTML = `
                <span class="wallet-icon">${icon}</span>
                <span>${short}</span>
            `;
            headerBtn.title = `${name}: ${addr}`;
            headerBtn.style.background = 'rgba(20, 241, 149, 0.15)';
            headerBtn.style.border = '1px solid rgba(20, 241, 149, 0.3)';
        } else {
            headerBtn.innerHTML = `
                <span class="wallet-icon">🔗</span>
                <span>Connect</span>
            `;
            headerBtn.title = 'Connect Wallet';
            headerBtn.style.background = '';
            headerBtn.style.border = '';
        }
    }
}

// ═══════════════════════════════════════════════
//  WALLET PICKER MODAL
// ═══════════════════════════════════════════════

function showWalletPicker() {
    // Remove existing
    closeWalletPicker();

    const wallets = getAllWallets();
    const installed = wallets.filter(w => w.installed);
    const notInstalled = wallets.filter(w => !w.installed);

    const overlay = document.createElement('div');
    overlay.id = 'wallet-picker-overlay';
    overlay.className = 'wallet-picker-overlay';
    overlay.innerHTML = `
    <div class="wallet-picker-modal">
      <div class="wallet-picker-header">
        <h3>Connect Wallet</h3>
        <button class="wallet-picker-close" id="wallet-picker-close">✕</button>
      </div>
      <div class="wallet-picker-subtitle">
        Choose a Solana wallet to connect
      </div>
      ${installed.length > 0 ? `
        <div class="wallet-picker-section">
          <div class="wallet-picker-section-title">Detected Wallets</div>
          <div class="wallet-picker-list">
            ${installed.map(w => `
              <button class="wallet-picker-item installed" data-wallet-id="${w.id}" style="--wallet-color: ${w.color}">
                <span class="wallet-picker-icon">${w.icon}</span>
                <span class="wallet-picker-name">${w.name}</span>
                <span class="wallet-picker-badge">Detected</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="wallet-picker-empty">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>No Solana wallets detected</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 4px;">Install one of the wallets below</div>
        </div>
      `}
      ${notInstalled.length > 0 ? `
        <div class="wallet-picker-section">
          <div class="wallet-picker-section-title">More Wallets</div>
          <div class="wallet-picker-list">
            ${notInstalled.map(w => `
              <button class="wallet-picker-item not-installed" data-wallet-id="${w.id}" style="--wallet-color: ${w.color}">
                <span class="wallet-picker-icon">${w.icon}</span>
                <span class="wallet-picker-name">${w.name}</span>
                <span class="wallet-picker-badge install">Install</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="wallet-picker-footer">
        <span>🔒</span> Only connect to sites you trust
      </div>
    </div>
  `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    // Bind events
    overlay.querySelector('#wallet-picker-close')?.addEventListener('click', closeWalletPicker);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeWalletPicker();
    });
    overlay.querySelectorAll('.wallet-picker-item').forEach(item => {
        item.addEventListener('click', () => {
            const walletId = item.getAttribute('data-wallet-id');
            connectWallet(walletId);
        });
    });
}

function closeWalletPicker() {
    const overlay = document.getElementById('wallet-picker-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// ═══════════════════════════════════════════════
//  UI RENDERING
// ═══════════════════════════════════════════════

export function renderWalletButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <div class="wallet-adapter" id="wallet-adapter">
      <button class="wallet-btn" id="wallet-connect-btn">
        <span class="wallet-icon">🔗</span>
        <span class="wallet-label">Connect Wallet</span>
      </button>
      <div class="wallet-info" id="wallet-info" style="display:none;">
        <div class="wallet-badge">
          <span class="wallet-status-dot"></span>
          <span class="wallet-address" id="wallet-address"></span>
        </div>
        <div class="wallet-balance" id="wallet-balance"></div>
        <button class="wallet-disconnect-btn" id="wallet-disconnect-btn" title="Disconnect">
          ✕
        </button>
      </div>
    </div>
  `;

    document.getElementById('wallet-connect-btn')?.addEventListener('click', () => connectWallet());
    document.getElementById('wallet-disconnect-btn')?.addEventListener('click', disconnectWallet);
}

function updateWalletUI() {
    const connectBtn = document.getElementById('wallet-connect-btn');
    const walletInfo = document.getElementById('wallet-info');
    const addressEl = document.getElementById('wallet-address');
    const balanceEl = document.getElementById('wallet-balance');

    if (!connectBtn || !walletInfo) return;

    if (walletState.connected) {
        connectBtn.style.display = 'none';
        walletInfo.style.display = 'flex';
        if (addressEl) addressEl.textContent = shortenAddress(walletState.publicKey);
        if (balanceEl) balanceEl.textContent = `${walletState.balance.toFixed(4)} SOL`;
    } else {
        connectBtn.style.display = 'flex';
        walletInfo.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════

export function showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✗', info: 'ℹ', loading: '⟳' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <span class="toast-icon ${type === 'loading' ? 'toast-spin' : ''}">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return toast;
}

export async function sendWithFeedback(txFn, actionName) {
    const loadingToast = showToast(`${actionName}...`, 'loading', 0);

    try {
        const result = await txFn();
        const sig = typeof result === 'string' ? result : result.tx;

        loadingToast.classList.remove('toast-visible');
        setTimeout(() => loadingToast.remove(), 300);

        showToast(
            `${actionName} confirmed! <a href="https://solscan.io/tx/${sig}?cluster=devnet" target="_blank" style="color:var(--accent-primary);">View ↗</a>`,
            'success',
            6000
        );

        return result;
    } catch (error) {
        loadingToast.classList.remove('toast-visible');
        setTimeout(() => loadingToast.remove(), 300);

        const msg = error.message?.includes('User rejected')
            ? 'Transaction cancelled by user'
            : error.message || 'Transaction failed';

        showToast(msg, 'error', 5000);
        throw error;
    }
}

// ═══════════════════════════════════════════════
//  AUTO-CONNECT ON LOAD
// ═══════════════════════════════════════════════

export async function tryAutoConnect() {
    try {
        const lastWallet = localStorage.getItem('solqueue_wallet');
        if (!lastWallet) return;

        const walletConfig = WALLET_CONFIGS.find(w => w.id === lastWallet);
        if (!walletConfig || !walletConfig.detect()) return;

        const provider = walletConfig.getProvider();
        const response = await provider.connect({ onlyIfTrusted: true });
        if (response.publicKey) {
            await connectWallet(lastWallet);
        }
    } catch (e) {
        // User hasn't approved auto-connect, that's fine
    }
}
