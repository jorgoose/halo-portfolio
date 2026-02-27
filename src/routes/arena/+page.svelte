<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { HudSnapshot } from '$lib/arena/types';
  import type { GameManager } from '$lib/arena/GameManager';

  let engineLoading = false;
  let engineReady = false;
  let canvas: HTMLCanvasElement;
  let gameManager: GameManager | null = null;

  let hud: HudSnapshot = {
    health: 100,
    maxHealth: 100,
    shield: 100,
    maxShield: 100,
    ammo: 32,
    maxAmmo: 32,
    reserveAmmo: 96,
    kills: 0,
    reloading: false,
    shieldRecharging: false,
    gameOver: false,
    paused: false
  };

  function onHudUpdate(snapshot: HudSnapshot) {
    hud = snapshot;
  }

  async function engage() {
    if (engineLoading || engineReady) return;
    engineLoading = true;

    try {
      const { initGameManager } = await import('$lib/arena/GameManager');
      canvas.style.display = 'block';

      gameManager = await initGameManager(canvas, onHudUpdate);
      engineReady = true;
    } catch (err) {
      console.error('Arena failed to load:', err);
    } finally {
      engineLoading = false;
    }
  }

  function handleResume() {
    if (gameManager && !hud.gameOver) {
      canvas.requestPointerLock();
    }
  }

  function handleRestart() {
    if (gameManager) {
      gameManager.restart();
    }
  }

  onDestroy(() => {
    if (gameManager) {
      gameManager.dispose();
      gameManager = null;
    }
  });

  $: shieldPct = (hud.shield / hud.maxShield) * 100;
  $: healthPct = (hud.health / hud.maxHealth) * 100;
</script>

<svelte:head>
  <title>Arena | HaloPortfolio</title>
  <meta name="description" content="ARENA — Training simulation mini-game." />
</svelte:head>

<div class="arena-bg">
  <video autoplay loop muted playsinline preload="metadata" class="background-video">
    <source src="/menu_background_vp9.webm" type="video/webm" />
    Your browser does not support the video tag.
  </video>

  {#if !engineReady}
    <div class="launch-screen">
      <h1 class="arena-title">ARENA</h1>
      <p class="arena-subtitle">TRAINING SIMULATION</p>
      <div class="status-indicator">
        <span class="status-dot"></span>
        SYSTEMS ONLINE
      </div>
      <button class="engage-btn" on:click={engage} disabled={engineLoading}>
        {engineLoading ? 'LOADING...' : 'ENGAGE'}
      </button>
    </div>
  {/if}

  <canvas bind:this={canvas} class="game-canvas"></canvas>

  {#if engineReady}
    <!-- HUD Overlay -->
    <div class="hud-overlay">
      <!-- Crosshair -->
      <div class="crosshair" class:hit={hud.reloading === false && hud.ammo > 0}>
        <div class="crosshair-h"></div>
        <div class="crosshair-v"></div>
      </div>

      <!-- Shield Bar -->
      <div class="shield-bar-container">
        <div class="bar-label">SHIELD</div>
        <div class="bar-track shield-track">
          <div
            class="bar-fill shield-fill"
            class:recharging={hud.shieldRecharging}
            style="width: {shieldPct}%"
          ></div>
        </div>
        <div class="bar-value">{Math.ceil(hud.shield)}</div>
      </div>

      <!-- Health Bar -->
      <div class="health-bar-container">
        <div class="bar-label">HEALTH</div>
        <div class="bar-track health-track">
          <div
            class="bar-fill health-fill"
            class:low={healthPct < 30}
            style="width: {healthPct}%"
          ></div>
        </div>
        <div class="bar-value">{Math.ceil(hud.health)}</div>
      </div>

      <!-- Ammo Counter -->
      <div class="ammo-container">
        {#if hud.reloading}
          <div class="reload-text">RELOADING</div>
        {:else}
          <div class="ammo-current">{hud.ammo}</div>
          <div class="ammo-divider">/</div>
          <div class="ammo-reserve">{hud.reserveAmmo}</div>
        {/if}
      </div>

      <!-- Kill Counter -->
      <div class="kill-container">
        <div class="kill-label">KILLS</div>
        <div class="kill-count">{hud.kills}</div>
      </div>

      <!-- Pause Overlay -->
      {#if hud.paused && !hud.gameOver}
        <div class="overlay-screen">
          <div class="overlay-title">PAUSED</div>
          <button class="overlay-btn" on:click={handleResume}>
            CLICK TO RESUME
          </button>
          <div class="overlay-hint">ESC to pause / click to resume</div>
        </div>
      {/if}

      <!-- Game Over Overlay -->
      {#if hud.gameOver}
        <div class="overlay-screen game-over">
          <div class="overlay-title game-over-title">SIMULATION TERMINATED</div>
          <div class="game-over-stats">
            <div class="stat-row">
              <span class="stat-label">KILLS</span>
              <span class="stat-value">{hud.kills}</span>
            </div>
          </div>
          <button class="overlay-btn restart-btn" on:click={handleRestart}>
            RESTART
          </button>
        </div>
      {/if}
    </div>
  {/if}

  {#if !engineReady}
    <div class="back-row">
      <div
        class="back-label"
        tabindex="0"
        role="button"
        aria-label="Back"
        on:click={() => history.back()}
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') history.back(); }}
      >= BACK</div>
    </div>
  {/if}
</div>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  box-sizing: border-box;
}

.arena-bg {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

.launch-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  gap: clamp(0.8rem, 2vh, 1.5rem);
}

.arena-title {
  font-family: 'Halo', 'Halo Outline', sans-serif;
  font-size: clamp(4rem, 12vw, 10rem);
  letter-spacing: clamp(0.4rem, 2vw, 1.5rem);
  background: linear-gradient(
    to bottom,
    #FFFFFF 0%,
    #FFFFFF 50%,
    #1976D2 75%,
    #001A3D 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 8px #001A3D66, 0 0 140px #FFFFFF;
  margin: 0;
  line-height: 1;
}

.arena-subtitle {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(0.9rem, 2.5vw, 1.6rem);
  color: #5ec3ff;
  letter-spacing: 0.3em;
  text-shadow: 0 0 8px #5ec3ff88, 0 0 2px #fff8;
  margin: 0;
  opacity: 0.8;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(0.7rem, 1.8vw, 1rem);
  color: #5ec3ff;
  letter-spacing: 0.15em;
  opacity: 0.7;
  animation: pulse-status 2.5s ease-in-out infinite;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5ec3ff;
  box-shadow: 0 0 6px #5ec3ff, 0 0 12px #5ec3ff88;
  animation: pulse-dot 2.5s ease-in-out infinite;
}

@keyframes pulse-status {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 6px #5ec3ff, 0 0 12px #5ec3ff88; }
  50% { box-shadow: 0 0 10px #5ec3ff, 0 0 20px #5ec3ffcc; }
}

.engage-btn {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  color: #5ec3ff;
  background: rgba(10, 20, 40, 0.7);
  border: 2.5px solid #5ec3ff;
  border-radius: 1.5rem;
  padding: clamp(0.6rem, 1.5vh, 1rem) clamp(2rem, 5vw, 4rem);
  letter-spacing: 0.2em;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 0 16px #5ec3ff44, 0 0 4px #5ec3ff22 inset;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s, border-color 0.2s;
  margin-top: clamp(0.5rem, 1.5vh, 1rem);
}

.engage-btn:hover:not(:disabled) {
  background: rgba(94, 195, 255, 0.15);
  color: #fff;
  border-color: #fff;
  box-shadow: 0 0 24px #5ec3ff88, 0 0 8px #5ec3ff44 inset;
}

.engage-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-canvas {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10;
  outline: none;
}

.back-row {
  position: fixed;
  bottom: clamp(1rem, 3vh, 2rem);
  left: clamp(1rem, 3vw, 2rem);
  z-index: 5;
}

.back-label {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(1rem, 3vh, 2rem);
  color: #5ec3ff;
  letter-spacing: 0.12em;
  text-shadow: 0 0 8px #5ec3ff88, 0 0 2px #fff8;
  text-transform: uppercase;
  cursor: pointer;
  outline: none;
  transition: color 0.2s;
}

.back-label:focus, .back-label:hover {
  color: #fff;
}

/* ===== HUD OVERLAY ===== */
.hud-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 20;
  pointer-events: none;
  font-family: 'Xolonium', Arial, sans-serif;
}

/* Crosshair */
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
}

.crosshair-h, .crosshair-v {
  position: absolute;
  background: rgba(94, 195, 255, 0.85);
  box-shadow: 0 0 4px #5ec3ff;
}

.crosshair-h {
  width: 24px;
  height: 2px;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}

.crosshair-v {
  width: 2px;
  height: 24px;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}

/* Shield Bar */
.shield-bar-container {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  font-size: 0.65rem;
  color: rgba(94, 195, 255, 0.7);
  letter-spacing: 0.15em;
  min-width: 52px;
  text-align: right;
}

.bar-track {
  width: 200px;
  height: 8px;
  background: rgba(94, 195, 255, 0.1);
  border: 1px solid rgba(94, 195, 255, 0.25);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.15s ease-out;
  border-radius: 1px;
}

.shield-fill {
  background: linear-gradient(90deg, #1976d2, #5ec3ff);
  box-shadow: 0 0 6px rgba(94, 195, 255, 0.4);
}

.shield-fill.recharging {
  animation: shield-pulse 0.6s ease-in-out infinite;
}

@keyframes shield-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.bar-value {
  font-size: 0.7rem;
  color: rgba(94, 195, 255, 0.8);
  min-width: 30px;
}

/* Health Bar */
.health-bar-container {
  position: absolute;
  top: 46px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
}

.health-fill {
  background: linear-gradient(90deg, #d32f2f, #ff6659);
  box-shadow: 0 0 6px rgba(211, 47, 47, 0.4);
}

.health-fill.low {
  animation: health-critical 0.5s ease-in-out infinite;
}

@keyframes health-critical {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; box-shadow: 0 0 12px rgba(255, 0, 0, 0.6); }
}

.health-track {
  border-color: rgba(211, 47, 47, 0.25);
  background: rgba(211, 47, 47, 0.08);
}

.health-bar-container .bar-label {
  color: rgba(255, 102, 89, 0.7);
}

.health-bar-container .bar-value {
  color: rgba(255, 102, 89, 0.8);
}

/* Ammo Counter */
.ammo-container {
  position: absolute;
  bottom: 32px;
  right: 40px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.ammo-current {
  font-size: 2rem;
  color: #5ec3ff;
  text-shadow: 0 0 8px rgba(94, 195, 255, 0.5);
}

.ammo-divider {
  font-size: 1.2rem;
  color: rgba(94, 195, 255, 0.4);
  margin: 0 2px;
}

.ammo-reserve {
  font-size: 1rem;
  color: rgba(94, 195, 255, 0.6);
}

.reload-text {
  font-size: 1rem;
  color: #5ec3ff;
  letter-spacing: 0.2em;
  animation: reload-blink 0.5s ease-in-out infinite;
}

@keyframes reload-blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Kill Counter */
.kill-container {
  position: absolute;
  bottom: 32px;
  left: 40px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.kill-label {
  font-size: 0.65rem;
  color: rgba(94, 195, 255, 0.6);
  letter-spacing: 0.15em;
}

.kill-count {
  font-size: 1.5rem;
  color: #5ec3ff;
  text-shadow: 0 0 6px rgba(94, 195, 255, 0.4);
}

/* Overlay Screens (Pause / Game Over) */
.overlay-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 5, 15, 0.75);
  pointer-events: auto;
  gap: 1.5rem;
}

.overlay-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  color: #5ec3ff;
  letter-spacing: 0.3em;
  text-shadow: 0 0 20px rgba(94, 195, 255, 0.5);
}

.game-over-title {
  color: #ff6659;
  text-shadow: 0 0 20px rgba(255, 50, 50, 0.5);
}

.overlay-btn {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  color: #5ec3ff;
  background: rgba(10, 20, 40, 0.8);
  border: 2px solid #5ec3ff;
  border-radius: 1.2rem;
  padding: 0.7rem 2.5rem;
  letter-spacing: 0.2em;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 0 12px rgba(94, 195, 255, 0.3);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  pointer-events: auto;
}

.overlay-btn:hover {
  background: rgba(94, 195, 255, 0.15);
  color: #fff;
  box-shadow: 0 0 20px rgba(94, 195, 255, 0.5);
}

.restart-btn {
  border-color: #ff6659;
  color: #ff6659;
  box-shadow: 0 0 12px rgba(255, 50, 50, 0.3);
}

.restart-btn:hover {
  background: rgba(255, 50, 50, 0.15);
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 50, 50, 0.5);
}

.overlay-hint {
  font-size: 0.7rem;
  color: rgba(94, 195, 255, 0.4);
  letter-spacing: 0.15em;
}

.game-over-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 102, 89, 0.6);
  letter-spacing: 0.15em;
}

.stat-value {
  font-size: 1.8rem;
  color: #ff6659;
  text-shadow: 0 0 8px rgba(255, 50, 50, 0.4);
}

@media (max-width: 600px) {
  .arena-title {
    font-size: clamp(3rem, 14vw, 5rem);
    letter-spacing: clamp(0.2rem, 1vw, 0.6rem);
  }

  .arena-subtitle {
    font-size: clamp(0.7rem, 3vw, 1rem);
    letter-spacing: 0.2em;
  }

  .engage-btn {
    font-size: clamp(0.9rem, 4vw, 1.2rem);
    padding: 0.6rem 2rem;
  }

  .bar-track {
    width: 120px;
  }

  .ammo-current {
    font-size: 1.4rem;
  }

  .ammo-container {
    right: 20px;
    bottom: 20px;
  }

  .kill-container {
    left: 20px;
    bottom: 20px;
  }
}
</style>
