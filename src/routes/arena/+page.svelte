<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { HudSnapshot } from '$lib/arena/types';
  import type { GameManager } from '$lib/arena/GameManager';

  let engineLoading = false;
  let engineReady = false;
  let canvas: HTMLCanvasElement;
  let backgroundVideo: HTMLVideoElement | null = null;
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

  function pauseBackgroundVideo() {
    if (!backgroundVideo) return;
    backgroundVideo.pause();
  }

  async function engage() {
    if (engineLoading || engineReady) return;
    engineLoading = true;

    try {
      const { initGameManager } = await import('$lib/arena/GameManager');
      canvas.style.display = 'block';

      gameManager = await initGameManager(canvas, onHudUpdate);
      engineReady = true;
      pauseBackgroundVideo();
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
    pauseBackgroundVideo();
    if (gameManager) {
      gameManager.dispose();
      gameManager = null;
    }
  });

  $: shieldPct = (hud.shield / hud.maxShield) * 100;
  $: healthPct = (hud.health / hud.maxHealth) * 100;
  $: shieldDepleted = shieldPct <= 0 && !hud.shieldRecharging;
</script>

<svelte:head>
  <title>Arena | HaloPortfolio</title>
  <meta name="description" content="ARENA — Training simulation mini-game." />
</svelte:head>

<div class="arena-bg">
  <video
    bind:this={backgroundVideo}
    autoplay
    loop
    muted
    playsinline
    preload="metadata"
    class="background-video"
    class:inactive={engineReady}
  >
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

      <!-- Shield Arc -->
      <div class="shield-wrapper" class:recharging={hud.shieldRecharging} class:depleted={shieldDepleted}>
        <svg class="shield-arc" viewBox="0 0 420 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shieldGrad" x1="210" y1="2" x2="210" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#b8f0ff" stop-opacity="0.8"/>
              <stop offset="35%" stop-color="#5ec3ff" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#1565c0" stop-opacity="0.4"/>
            </linearGradient>
            <clipPath id="arcClip">
              <path d="M 3,26 Q 210,2 417,26 L 419,29 Q 210,15 1,29 Z"/>
            </clipPath>
            <filter id="shieldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Background track -->
          <path
            d="M 3,26 Q 210,2 417,26 L 419,29 Q 210,15 1,29 Z"
            fill="rgba(0,20,40,0.3)"
            stroke="rgba(94,195,255,0.12)"
            stroke-width="0.5"
          />

          <!-- Shield fill -->
          <g clip-path="url(#arcClip)" filter="url(#shieldGlow)">
            <rect class="shield-fill-rect" x="0" y="0" width={shieldPct * 4.2} height="32" fill="url(#shieldGrad)"/>
          </g>

          <!-- Glass highlight near top edge -->
          <path
            d="M 12,26 Q 210,4 408,26"
            stroke="rgba(255,255,255,0.15)"
            stroke-width="0.6"
            clip-path="url(#arcClip)"
          />

          <!-- Segment dividers -->
          <g clip-path="url(#arcClip)">
            {#each [84, 168, 252, 336] as x}
              <line x1={x} y1="0" x2={x} y2="32" stroke="rgba(0,10,20,0.55)" stroke-width="1.5"/>
            {/each}
          </g>

          <!-- Top edge highlight -->
          <path
            d="M 3,26 Q 210,2 417,26"
            stroke="rgba(94,195,255,0.2)"
            stroke-width="0.5"
          />
        </svg>
      </div>

      <!-- Health Segments -->
      <div class="health-wrapper" class:critical={healthPct < 30}>
        {#each Array(10) as _, i}
          <div class="health-segment" class:filled={healthPct > i * 10}></div>
        {/each}
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

.background-video.inactive {
  display: none;
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

/* ===== SHIELD ARC (Halo visor-style) ===== */
.shield-wrapper {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: clamp(260px, 32vw, 460px);
}

/* Visor haze ambient glow */
.shield-wrapper::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 130%;
  height: 500%;
  background: radial-gradient(ellipse at center, rgba(94, 195, 255, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.shield-arc {
  width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 0 6px rgba(94, 195, 255, 0.25));
}

.shield-fill-rect {
  transition: width 0.15s ease-out;
}

/* Recharging — pulsing glow bloom */
.shield-wrapper.recharging .shield-arc {
  animation: shield-arc-pulse 0.7s ease-in-out infinite;
}

@keyframes shield-arc-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(94, 195, 255, 0.25));
  }
  50% {
    filter: drop-shadow(0 0 18px rgba(94, 195, 255, 0.7))
           drop-shadow(0 0 36px rgba(94, 195, 255, 0.25));
  }
}

/* Depleted — bright flash on shield break */
.shield-wrapper.depleted .shield-arc {
  animation: shield-arc-flash 0.35s ease-out;
}

@keyframes shield-arc-flash {
  0% {
    filter: drop-shadow(0 0 24px rgba(94, 195, 255, 0.9)) brightness(1.8);
  }
  100% {
    filter: drop-shadow(0 0 6px rgba(94, 195, 255, 0.25));
  }
}

/* ===== HEALTH SEGMENTS (Halo-style) ===== */
.health-wrapper {
  position: absolute;
  top: 52px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 3px;
}

.health-segment {
  width: 20px;
  height: 6px;
  background: rgba(255, 80, 60, 0.12);
  border: 1px solid rgba(255, 80, 60, 0.15);
  clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
  transition: background 0.15s ease-out, box-shadow 0.15s ease-out;
}

.health-segment.filled {
  background: linear-gradient(to bottom, #ff8a65, #e64a19);
  border-color: rgba(255, 100, 60, 0.4);
  box-shadow: 0 0 6px rgba(255, 80, 50, 0.4);
}

/* Critical health — urgent red pulse */
.health-wrapper.critical .health-segment.filled {
  animation: health-critical-pulse 0.5s ease-in-out infinite;
}

@keyframes health-critical-pulse {
  0%, 100% {
    opacity: 0.6;
    box-shadow: 0 0 4px rgba(255, 40, 20, 0.3);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 14px rgba(255, 40, 20, 0.7);
  }
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

  .shield-wrapper {
    width: clamp(200px, 55vw, 300px);
    top: 10px;
  }

  .health-wrapper {
    top: 38px;
    gap: 2px;
  }

  .health-segment {
    width: 14px;
    height: 5px;
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
