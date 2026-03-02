/**
 * SolQueue Wallet Adapter — UI for connecting/disconnecting Phantom wallet
 * Integrates with the SolQueue SDK for on-chain interactions
 */

import {
    connectPhantomWallet,
    disconnectPhantomWallet,
    SolQueueClient,
    shortenAddress,
    DEVNET_RPC
} from '../sdk/index.js';
import { Connection } from '@solana/web3.js';

// ═══════════════════════════════════════════════
//  WALLET STATE
// ═══════════════════════════════════════════════

let walletState = {
    connected: false,
    publicKey: null,
    balance: 0,
    client: null,
    listeners: [],
};

/**
 * Get current wallet state
 */
export function getWalletState() {
    return { ...walletState };
}

/**
 * Get the SolQueue client instance
 */
export function getClient() {
    return walletState.client;
}

/**
 * Subscribe to wallet state changes
 */
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
//  WALLET ACTIONS
// ═══════════════════════════════════════════════

/**
 * Connect wallet and initialize SDK client
 */
export async function connectWallet() {
    try {
        const connection = new Connection(DEVNET_RPC, 'confirmed');
        const { wallet, publicKey } = await connectPhantomWallet();

        const client = new SolQueueClient(connection, wallet);
        const balance = await connection.getBalance(publicKey);

        walletState = {
            connected: true,
            publicKey: publicKey.toString(),
            balance: balance / 1e9, // Convert lamports to SOL
            client,
            listeners: walletState.listeners,
        };

        notifyListeners();
        updateWalletUI();

        return client;
    } catch (error) {
        console.error('Wallet connection failed:', error);
        showToast(`Connection failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet() {
    try {
        await disconnectPhantomWallet();
        if (walletState.client) {
            await walletState.client.unsubscribeAll();
        }
    } catch (e) {
        console.error('Disconnect error:', e);
    }

    walletState = {
        connected: false,
        publicKey: null,
        balance: 0,
        client: null,
        listeners: walletState.listeners,
    };

    notifyListeners();
    updateWalletUI();
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

// ═══════════════════════════════════════════════
//  UI RENDERING
// ═══════════════════════════════════════════════

/**
 * Render the wallet connect button into a container
 */
export function renderWalletButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <div class="wallet-adapter" id="wallet-adapter">
      <button class="wallet-btn" id="wallet-connect-btn">
        <span class="wallet-icon">👻</span>
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

    // Bind events
    document.getElementById('wallet-connect-btn')?.addEventListener('click', connectWallet);
    document.getElementById('wallet-disconnect-btn')?.addEventListener('click', disconnectWallet);
}

/**
 * Update the wallet UI based on current state
 */
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

/**
 * Show a toast notification for transaction feedback
 * @param {string} message 
 * @param {'success'|'error'|'info'|'loading'} type 
 * @param {number} duration - Duration in ms (0 = persistent)
 * @returns {HTMLElement} The toast element (for updating loading toasts)
 */
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

    // Animate in
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return toast;
}

/**
 * Send a transaction with toast feedback
 * @param {Function} txFn - Async function that sends the transaction
 * @param {string} actionName - Human-readable action description
 * @returns {Promise<string>} Transaction signature
 */
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

/**
 * Try to reconnect if wallet was previously connected
 */
export async function tryAutoConnect() {
    try {
        const { solana } = window;
        if (solana?.isPhantom) {
            const response = await solana.connect({ onlyIfTrusted: true });
            if (response.publicKey) {
                await connectWallet();
            }
        }
    } catch (e) {
        // User hasn't approved auto-connect, that's fine
    }
}
