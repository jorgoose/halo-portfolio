<script lang="ts">
  let engineLoading = false;
  let engineReady = false;
  let canvas: HTMLCanvasElement;

  async function engage() {
    if (engineLoading || engineReady) return;
    engineLoading = true;

    try {
      const BABYLON = await import('@babylonjs/core');
      canvas.style.display = 'block';

      const engine = new BABYLON.Engine(canvas, true);
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

      const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 1.6, -5), scene);
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.attachControl(canvas, true);

      new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

      engine.runRenderLoop(() => scene.render());

      window.addEventListener('resize', () => engine.resize());

      engineReady = true;
    } catch (err) {
      console.error('Babylon.js failed to load:', err);
    } finally {
      engineLoading = false;
    }
  }
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
}
</style>
