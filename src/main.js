/**
 * SolQueue — Main Entry Point
 * On-Chain Job Queue System for Solana
 */

import './styles/global.css';
import './styles/landing.css';
import './styles/dashboard.css';
import './styles/wallet.css';

import { ThreeBackground } from './animations/three-bg.js';
import { renderLandingPage, initLandingPage } from './pages/landing.js';
import { renderDashboard, initDashboard } from './pages/dashboard.js';

// Initialize Three.js background
let threeBg = null;

function initThreeBackground() {
  const container = document.getElementById('three-canvas');
  if (container && !threeBg) {
    threeBg = new ThreeBackground(container);
  }
}

// Router
function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const app = document.getElementById('app');

  if (hash === '/' || hash === '') {
    // Landing page
    app.innerHTML = renderLandingPage();
    initLandingPage();
    if (threeBg) threeBg.setMode(true);
    document.getElementById('three-canvas').style.opacity = '1';
  } else if (hash.startsWith('/dashboard')) {
    // Dashboard pages
    const parts = hash.split('/');
    const page = parts[2] || 'overview';
    app.innerHTML = renderDashboard(page);
    initDashboard(page);
    if (threeBg) threeBg.setMode(false);
    document.getElementById('three-canvas').style.opacity = '0.3';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initThreeBackground();
  handleRoute();

  window.addEventListener('hashchange', handleRoute);

  // Initialize data service
  try {
    const { initDataService } = await import('./utils/data-service.js');
    initDataService();
  } catch (e) { console.warn('Data service init:', e); }

  // Try auto-connect wallet
  try {
    const { tryAutoConnect } = await import('./utils/wallet-adapter.js');
    await tryAutoConnect();
  } catch (e) { /* No wallet available */ }
});

// Smooth page transitions
const style = document.createElement('style');
style.textContent = `
  #three-canvas {
    transition: opacity 0.5s ease;
  }
  #app {
    animation: fadeIn 0.3s ease;
  }
`;
document.head.appendChild(style);

// Add particle effect to landing page
function createParticleOverlay() {
  const canvas = document.createElement('canvas');
  const container = document.getElementById('particle-canvas');
  if (!container) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = [];
  const count = 50;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: ['#9945FF', '#14F195', '#00D4AA'][Math.floor(Math.random() * 3)],
    });
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw connections between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(153, 69, 255, ${0.05 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animateParticles);
  }

  animateParticles();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Initialize particles after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  createParticleOverlay();
});
