<script lang="ts">
import { onMount } from 'svelte';
import RadioWidget from '$lib/RadioWidget.svelte';

let crtMode = false;
let videoAutoplayFailed = false;
let hasCheckedAutoplay = false;

const menuItems = [
  { label: 'ABOUT', link: '/about' },
  { label: 'EXPERIENCE', link: '/experience' },
  { label: 'PROJECTS', link: '/projects' },
  { label: 'SKILLS', link: '/skills' },
  { label: 'CONTACT', link: '/contact' },
  { label: 'ARENA', link: '/arena' }
];

function toggleCrtMode() {
  crtMode = !crtMode;
  hasCheckedAutoplay = false;
  if (typeof window !== 'undefined') {
    localStorage.setItem('crtMode', crtMode.toString());
  }
}

function handleVideoLoad(event: Event) {
  const video = event.target as HTMLVideoElement;

  // Check sessionStorage cache first (survives navigation within session)
  const cachedStatus = sessionStorage.getItem('autoplayStatus');
  if (cachedStatus === 'working' || cachedStatus === 'dismissed') {
    hasCheckedAutoplay = true;
    return;
  }
  if (cachedStatus === 'failed') {
    videoAutoplayFailed = true;
    hasCheckedAutoplay = true;
    return;
  }

  if (hasCheckedAutoplay) return;
  hasCheckedAutoplay = true;

  // If the browser's autoplay attribute already started playback, we're done
  if (!video.paused) {
    videoAutoplayFailed = false;
    sessionStorage.setItem('autoplayStatus', 'working');
    return;
  }

  // Video is paused after load — autoplay may have been blocked.
  // Try playing explicitly to confirm.
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      videoAutoplayFailed = false;
      sessionStorage.setItem('autoplayStatus', 'working');
    }).catch(() => {
      videoAutoplayFailed = true;
      sessionStorage.setItem('autoplayStatus', 'failed');
    });
  }
}

function playVideo() {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    video.play().then(() => {
      videoAutoplayFailed = false;
      sessionStorage.setItem('autoplayStatus', 'working');
    }).catch(err => {
      console.warn('Video play failed:', err);
    });
  });
}

onMount(() => {
  if (typeof window !== 'undefined') {
    crtMode = localStorage.getItem('crtMode') === 'true';

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crtMode') {
        crtMode = e.newValue === 'true';
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
});
</script>

<svelte:head>
  <title>HaloPortfolio</title>
  <meta name="description" content="Logan's software engineering portfolio — projects, skills, and experience." />
</svelte:head>

<div class="crt-toggle-bar">
  <button class="crt-toggle" on:click={toggleCrtMode}>
    CRT Mode: {crtMode ? 'On' : 'Off'}
  </button>
</div>

{#if videoAutoplayFailed}
  <div class="autoplay-notification">
    <div class="notification-content">
      <h3>VIDEO AUTOPLAY DISABLED</h3>
      <p>To experience the full site, please:</p>
      <ul>
        <li>Turn off Low Power Mode (iOS)</li>
        <li>Allow autoplay in your browser settings</li>
        <li>Or click "Play Video" below</li>
      </ul>
      <div class="notification-buttons">
        <button class="notification-play" on:click={playVideo}>
          PLAY VIDEO
        </button>
        <button class="notification-close" on:click={() => {videoAutoplayFailed = false; hasCheckedAutoplay = true; sessionStorage.setItem('autoplayStatus', 'dismissed');}}>
          Got it
        </button>
      </div>
    </div>
  </div>
{/if}

<RadioWidget
  audioSrc="/audio/cortana_and_chief_audio_tmp_1.mp3"
  initialSpeaker="chief"
  speakerTimings={[{time:0,speaker:'chief'},{time:6,speaker:'cortana'},{time:31,speaker:'chief'}]}
  position="right"
  resetOnEnd={true}
/>

{#if crtMode}
  <div class="crt-background">
    <div class="tv-frame">
      <div class="crt-overlay"></div>
      <video autoplay loop muted playsinline preload="metadata" class="background-video" on:loadeddata={handleVideoLoad} on:error={() => {if (!hasCheckedAutoplay) {hasCheckedAutoplay = true; videoAutoplayFailed = true;}}}>
        <source src="/menu_background_vp9.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div class="title-sigil-container">
        <div class="sigil-container">
          <svg viewBox="0 0 1200 400" class="sigil-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="600" cy="200" r="220" stroke="#5ec3ff" stroke-width="4" opacity="0.5" />
            <circle cx="600" cy="200" r="160" stroke="#5ec3ff" stroke-width="2" opacity="0.3" />
            <circle cx="600" cy="200" r="80" stroke="#5ec3ff" stroke-width="1.5" opacity="0.2" />
            <g opacity="0.5">
              <line x1="600" y1="40" x2="600" y2="360" stroke="#5ec3ff" stroke-width="2" />
              <line x1="40" y1="200" x2="1160" y2="200" stroke="#5ec3ff" stroke-width="2" />
              <line x1="200" y1="100" x2="1000" y2="300" stroke="#5ec3ff" stroke-width="1.2" />
              <line x1="1000" y1="100" x2="200" y2="300" stroke="#5ec3ff" stroke-width="1.2" />
            </g>
            <g opacity="0.7">
              <ellipse cx="600" cy="200" rx="350" ry="90" stroke="#5ec3ff" stroke-width="1" />
              <ellipse cx="600" cy="200" rx="90" ry="180" stroke="#5ec3ff" stroke-width="1" />
            </g>
            <g opacity="0.25">
              <path d="M 80 200 Q 200 120 600 120 Q 1000 120 1120 200" stroke="#5ec3ff" stroke-width="2" fill="none" />
              <path d="M 80 200 Q 200 280 600 280 Q 1000 280 1120 200" stroke="#5ec3ff" stroke-width="2" fill="none" />
            </g>
            <g opacity="0.7">
              <rect x="60" y="180" width="40" height="40" rx="8" stroke="#5ec3ff" stroke-width="2" />
              <rect x="1100" y="180" width="40" height="40" rx="8" stroke="#5ec3ff" stroke-width="2" />
            </g>
            <circle cx="600" cy="200" r="12" fill="#5ec3ff" opacity="0.7" />
          </svg>
        </div>
        <h1 class="halo-title">LOGAN</h1>
      </div>
      <ul class="menu">
        {#each menuItems as item}
          <li><a href={item.link}>{item.label}</a></li>
        {/each}
      </ul>
      <div class="tv-stand"></div>
      <div class="tv-base"></div>
    </div>
  </div>
{:else}
  <div class="halo-bg">
    <video autoplay loop muted playsinline preload="metadata" class="background-video" on:loadeddata={handleVideoLoad} on:error={() => {if (!hasCheckedAutoplay) {hasCheckedAutoplay = true; videoAutoplayFailed = true;}}}>
      <source src="/menu_background_vp9.webm" type="video/webm" />
      Your browser does not support the video tag.
    </video>
    <div class="title-sigil-container">
      <div class="sigil-container">
        <svg viewBox="0 0 1200 400" class="sigil-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="600" cy="200" r="220" stroke="#5ec3ff" stroke-width="4" opacity="0.5" />
          <circle cx="600" cy="200" r="160" stroke="#5ec3ff" stroke-width="2" opacity="0.3" />
          <circle cx="600" cy="200" r="80" stroke="#5ec3ff" stroke-width="1.5" opacity="0.2" />
          <g opacity="0.5">
            <line x1="600" y1="40" x2="600" y2="360" stroke="#5ec3ff" stroke-width="2" />
            <line x1="40" y1="200" x2="1160" y2="200" stroke="#5ec3ff" stroke-width="2" />
            <line x1="200" y1="100" x2="1000" y2="300" stroke="#5ec3ff" stroke-width="1.2" />
            <line x1="1000" y1="100" x2="200" y2="300" stroke="#5ec3ff" stroke-width="1.2" />
          </g>
          <g opacity="0.7">
            <ellipse cx="600" cy="200" rx="350" ry="90" stroke="#5ec3ff" stroke-width="1" />
            <ellipse cx="600" cy="200" rx="90" ry="180" stroke="#5ec3ff" stroke-width="1" />
          </g>
          <g opacity="0.25">
            <path d="M 80 200 Q 200 120 600 120 Q 1000 120 1120 200" stroke="#5ec3ff" stroke-width="2" fill="none" />
            <path d="M 80 200 Q 200 280 600 280 Q 1000 280 1120 200" stroke="#5ec3ff" stroke-width="2" fill="none" />
          </g>
          <g opacity="0.7">
            <rect x="60" y="180" width="40" height="40" rx="8" stroke="#5ec3ff" stroke-width="2" />
            <rect x="1100" y="180" width="40" height="40" rx="8" stroke="#5ec3ff" stroke-width="2" />
          </g>
          <circle cx="600" cy="200" r="12" fill="#5ec3ff" opacity="0.7" />
        </svg>
      </div>
      <h1 class="halo-title">LOGAN</h1>
    </div>
    <ul class="menu">
      {#each menuItems as item}
        <li><a href={item.link}>{item.label}</a></li>
      {/each}
    </ul>
  </div>
{/if}

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  box-sizing: border-box;
}

.crt-toggle-bar {
  width: 100vw;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem 2rem 0.5rem 0;
  z-index: 100;
  position: fixed;
  top: 0;
  right: 0;
  box-sizing: border-box;
}
.crt-toggle {
  background: #181818;
  color: #5ec3ff;
  border: 2px solid #5ec3ff;
  border-radius: 1.2em;
  font-size: 1.1rem;
  padding: 0.4em 1.2em;
  font-family: 'Xolonium', Arial, sans-serif;
  cursor: pointer;
  box-shadow: 0 0 8px #5ec3ff44;
  transition: background 0.2s, color 0.2s, border 0.2s;
}
.crt-toggle:hover {
  background: #5ec3ff;
  color: #181818;
  border: 2px solid #fff;
}

.autoplay-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: rgba(10, 20, 40, 0.85);
  border: 2.5px solid #1976d2;
  border-radius: 1.5rem;
  padding: 2rem;
  max-width: 400px;
  width: 90vw;
  box-shadow: 0 0 32px #1976d288, 0 0 2px #fff8;
}

.notification-content h3 {
  color: #5ec3ff;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  text-align: center;
}

.notification-content p {
  color: #fff;
  font-family: 'Xolonium', Arial, sans-serif;
  margin: 0 0 1rem 0;
}

.notification-content ul {
  color: #fff;
  font-family: 'Xolonium', Arial, sans-serif;
  margin: 0 0 1.5rem 0;
  padding-left: 1.5rem;
}

.notification-content li {
  margin: 0.5rem 0;
}

.notification-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
}

.notification-play {
  background: rgba(20, 30, 50, 0.7);
  color: #5ec3ff;
  border: 2.5px solid #5ec3ff;
  border-radius: 1.5rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
  box-shadow: 0 0 8px #5ec3ff88;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.notification-play:hover {
  background: #0a223a;
  color: #fff;
  border-color: #5ec3ff;
}

.notification-close {
  background: rgba(20, 30, 50, 0.7);
  color: #5ec3ff;
  border: 2.5px solid #1976d2;
  border-radius: 1.5rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1rem;
  cursor: pointer;
  flex: 1;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.notification-close:hover {
  background: #0a223a;
  color: #fff;
  border-color: #5ec3ff;
}

/* CRT TV styles (reuse from projects page) */
.crt-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: url('/CRT_bg.jpeg') 44% 54% no-repeat;
  background-size: 124%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tv-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  aspect-ratio: 4 / 3;
  width: 90vw;
  max-width: 1200px;
  max-height: 90vh;
  background: linear-gradient(180deg, #23272b 0%, #18191a 100%);
  border: 24px solid #444b52;
  border-radius: 3.5rem;
  box-shadow:
    0 0 64px 8px #00bfff33,
    0 0 0 12px #222b,
    0 8px 32px #000c,
    0 0 0 2px #222 inset;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  box-sizing: border-box;
  z-index: 2;
  padding: clamp(1rem, 3vh, 2rem);
}

.tv-frame::before {
  content: '';
  pointer-events: none;
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  border-radius: 2.8rem;
  background: linear-gradient(120deg, rgba(255,255,255,0.13) 10%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.18) 100%);
  z-index: 2;
}

.tv-frame::after {
  content: '';
  pointer-events: none;
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  border-radius: 2.7rem;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255,255,255,0.03) 0px,
    rgba(255,255,255,0.03) 1px,
    transparent 2px,
    transparent 4px
  );
  z-index: 3;
  mix-blend-mode: lighten;
}

.crt-overlay {
  pointer-events: none;
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  z-index: 5;
  mix-blend-mode: lighten;
  will-change: opacity;
  contain: layout style paint;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(0,0,0,0.13) 0px,
      rgba(0,0,0,0.13) 2px,
      transparent 3px,
      transparent 6px
    ),
    repeating-linear-gradient(
      to right,
      rgba(255,0,0,0.07) 0px, rgba(255,0,0,0.07) 1px,
      rgba(0,255,0,0.07) 1px, rgba(0,255,0,0.07) 2px,
      rgba(0,0,255,0.07) 2px, rgba(0,0,255,0.07) 3px
    ),
    radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.22) 100%);
  animation: crt-flicker 1.2s infinite steps(2);
}
@keyframes crt-flicker {
  0% { opacity: 0.97; }
  50% { opacity: 1; }
  100% { opacity: 0.97; }
}
.tv-stand {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translate(-50%, -10%);
  width: 180px;
  height: 32px;
  background: linear-gradient(180deg, #222 60%, #444 100%);
  border-radius: 0 0 48px 48px / 0 0 32px 32px;
  box-shadow: 0 8px 24px #000a;
  z-index: 1;
}
.tv-base {
  position: absolute;
  left: 50%;
  top: calc(100% + 18px);
  transform: translate(-50%, 0);
  width: 340px;
  height: 48px;
  background: linear-gradient(180deg, #222 60%, #444 100%);
  border-radius: 0 0 120px 120px / 0 0 48px 48px;
  box-shadow: 0 12px 32px #000b, 0 2px 0 #111 inset;
  z-index: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.tv-base::before {
  content: '';
  display: block;
  position: absolute;
  left: 10%;
  right: 10%;
  top: 30%;
  height: 8px;
  border-radius: 4px;
  background: repeating-linear-gradient(
    to right,
    #333 0 8px,
    #222 8px 16px
  );
  opacity: 0.7;
}
@media (max-width: 900px) {
  .tv-frame {
    width: 98vw;
    max-width: 100vw;
    border-width: 12px;
    border-radius: 2rem;
  }
  .tv-frame::before {
    border-radius: 1.6rem;
  }
  .tv-frame::after {
    border-radius: 1.5rem;
  }
  .tv-stand {
    width: 100px;
    height: 18px;
    border-radius: 0 0 32px 32px / 0 0 16px 16px;
  }
  .tv-base {
    width: 180px;
    height: 24px;
    border-radius: 0 0 60px 60px / 0 0 24px 24px;
  }
  .tv-base::before {
    height: 4px;
    border-radius: 2px;
  }
}
@media (max-width: 700px) {
  html, body {
    max-width: 100vw;
    overflow-x: hidden;
  }
  
  .crt-background {
    background: url('/CRT_bg.jpeg') 47.5% 55.75% no-repeat;
    background-size: 255%;
  }
  
  .tv-frame {
    width: 100vw;
    max-width: 100vw;
    min-width: 0;
    aspect-ratio: 4 / 3;
    border-width: 2vw;
    border-radius: 0.7rem;
    box-shadow: 0 0 24px 2px #00bfff33, 0 0 0 2vw #222b, 0 4px 16px #000c, 0 0 0 1px #222 inset;
  }
  .tv-frame::before {
    border-radius: 0.5rem;
  }
  .tv-frame::after {
    border-radius: 0.4rem;
  }
  .crt-overlay {
    border-radius: 0.5rem;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
  }
  .background-video {
    border-radius: 0.5rem;
    width: 100%;
    height: 100%;
    object-fit: cover;
    left: 0;
    top: 0;
  }
  .tv-stand {
    width: 60px;
    height: 10px;
    border-radius: 0 0 12px 12px / 0 0 6px 6px;
    top: 100%;
    left: 50%;
    transform: translate(-50%, 0);
  }
  .tv-base {
    width: 100px;
    height: 12px;
    border-radius: 0 0 24px 24px / 0 0 8px 8px;
    top: calc(100% + 8px);
    left: 50%;
    transform: translate(-50%, 0);
  }
  .tv-base::before {
    height: 2px;
    border-radius: 1px;
  }
}
.title-sigil-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 2rem;
}

/* CRT mode container scaling - only applies when inside TV frame */
.tv-frame .title-sigil-container {
  margin-bottom: clamp(0.5rem, 2vh, 1.5rem);
}
.sigil-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  width: 90vw;
  max-width: 1200px;
  min-width: 320px;
  pointer-events: none;
  opacity: 0.5;
}

/* CRT mode sigil scaling - only applies when inside TV frame */
.tv-frame .sigil-container {
  width: clamp(200px, 80%, 800px);
  max-width: 90%;
}
.sigil-svg {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 0 32px #5ec3ff88) drop-shadow(0 0 8px #5ec3ff44);
}
.halo-title {
  font-size: 9vw;
  letter-spacing: 1rem;
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
  text-shadow: 
  0 2px 8px #001A3D66, 
  0 0 140px #FFFFFF;
  font-family: 'Halo', 'Halo Outline', sans-serif;
}

/* CRT mode text scaling - only applies when inside TV frame */
.tv-frame .halo-title {
  font-size: clamp(4rem, 15vw, 8rem);
  letter-spacing: clamp(0.4rem, 2vw, 1.5rem);
}
.menu {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}
.menu li a {
  font-size: 3.2rem;
  color: #5ec3ff;
  text-decoration: none;
  letter-spacing: 0.2rem;
  text-shadow: 0 0 10px #5ec3ff, 0 0 2px #fff;
  transition: color 0.2s, text-shadow 0.2s;
  font-family: 'Xolonium', Arial, sans-serif;
  text-align: center;
}

/* CRT mode text scaling - only applies when inside TV frame */
.tv-frame .menu li a {
  font-size: clamp(1rem, 3vw, 2rem);
  letter-spacing: clamp(0.1rem, 0.3vw, 0.2rem);
}
.menu li a:hover {
  color: #fff;
  text-shadow: 0 0 20px #fff, 0 0 10px #5ec3ff;
}
.halo-bg {
  height: 100vh;
  width: 100vw;
  background: radial-gradient(ellipse at center, #222 0%, #111 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #b8d0ff;
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

@media (max-width: 600px) {
  .halo-title {
    font-size: 12vw;
  }
  .menu li a {
    font-size: 1.1rem;
  }
  
  /* CRT mode mobile scaling */
  .tv-frame .halo-title {
    font-size: clamp(2.5rem, 10vw, 5rem);
    letter-spacing: clamp(0.25rem, 1vw, 0.8rem);
  }
  
  .tv-frame .menu li a {
    font-size: clamp(0.8rem, 2.5vw, 1.5rem);
    letter-spacing: clamp(0.05rem, 0.2vw, 0.1rem);
  }
}
</style>
