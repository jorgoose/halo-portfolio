<script lang="ts">
import { onMount } from 'svelte';

let crtMode = false;
let videoAutoplayFailed = false;
let hasCheckedAutoplay = false;
let radioExpanded = false;
let audioContext: AudioContext;
let analyser: AnalyserNode;
let audioSource: MediaElementAudioSourceNode;
let animationId: number;
let currentSpeaker = 'chief'; // 'chief' or 'cortana'
let audioElement: HTMLAudioElement;
let fadeOpacity = 1; // For smooth transitions
let isTransitioning = false;
let speakerInterval: ReturnType<typeof setInterval>;
let fadeOutTimer: ReturnType<typeof setInterval>;
let fadeInTimer: ReturnType<typeof setInterval>;
let selectedItem = 0;
let menuItemRefs: HTMLElement[] = [];

const menuItems = [
  { label: 'ABOUT', link: '/about' },
  { label: 'EXPERIENCE', link: '/experience' },
  { label: 'PROJECTS', link: '/projects' },
  { label: 'SKILLS', link: '/skills' },
  { label: 'CONTACT', link: '/contact' }
];

function toggleCrtMode() {
  crtMode = !crtMode;
  if (typeof window !== 'undefined') {
    localStorage.setItem('crtMode', crtMode.toString());
  }
}

function handleVideoLoad(event: Event) {
  const video = event.target as HTMLVideoElement;
  
  // Check if we've already determined autoplay status this session
  if (typeof window !== 'undefined') {
    const sessionAutoplayStatus = sessionStorage.getItem('autoplayStatus');
    if (sessionAutoplayStatus === 'working') {
      videoAutoplayFailed = false;
      hasCheckedAutoplay = true;
      return;
    } else if (sessionAutoplayStatus === 'failed') {
      videoAutoplayFailed = true;
      hasCheckedAutoplay = true;
      return;
    }
  }
  // Check if video is actually playing after a short delay
  if (video && !hasCheckedAutoplay) {
    hasCheckedAutoplay = true;
    
    // Check if video is actually playing after a short delay
    const checkPlayback = () => {
      if (video.paused || video.ended) {
        videoAutoplayFailed = true;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('autoplayStatus', 'failed');
        }
      } else {
        videoAutoplayFailed = false;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('autoplayStatus', 'working');
        }
      }
    };
    
    // Check after a short delay to allow autoplay to start
    setTimeout(checkPlayback, 1000);
    
    // Also listen for play/pause events
    video.addEventListener('play', () => {
      videoAutoplayFailed = false;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('autoplayStatus', 'working');
      }
    });
    
    video.addEventListener('pause', () => {
      if (video.currentTime === 0) {
        videoAutoplayFailed = true;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('autoplayStatus', 'failed');
        }
      }
    });
    
    // Add error handling for video load failures
    video.addEventListener('error', () => {
      videoAutoplayFailed = true;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('autoplayStatus', 'failed');
      }
    });
  }
}

function playVideo() {
  // Find all video elements and try to play them
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    video.play().then(() => {
      videoAutoplayFailed = false;
      hasCheckedAutoplay = true; // Mark that we've successfully handled autoplay
    }).catch(() => {
      // Video play failed
    });
  });
}

function toggleRadio() {
  if (!radioExpanded) {
    // Start playing audio and expand
    audioElement = new Audio('/audio/cortana_and_chief_audio_tmp_1.mp3');

    // Initialize audio context for visualization
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      audioSource = audioContext.createMediaElementSource(audioElement);
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (err) {
      console.error('Failed to create AudioContext:', err);
      return;
    }

    // Start playing
    audioElement.play().then(() => {
      radioExpanded = true;
      startVisualization();
      startSpeakerTracking();
    }).catch(() => {
      // Audio play failed
    });

    // Listen for audio end
    audioElement.addEventListener('ended', () => {
      radioExpanded = false;
      stopVisualization();
      currentSpeaker = 'chief'; // Reset to default
    });
  } else {
    // Stop audio and collapse
    radioExpanded = false;
    stopVisualization();
    if (speakerInterval) { clearInterval(speakerInterval); }
    if (fadeOutTimer) { clearInterval(fadeOutTimer); }
    if (fadeInTimer) { clearInterval(fadeInTimer); }
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    if (audioContext) {
      audioContext.close();
    }
    currentSpeaker = 'chief'; // Reset to default
  }
}

function startVisualization() {
  const canvas = document.getElementById('waveform-canvas') as HTMLCanvasElement;
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const widgetRadius = canvas.width / 2 - 2; // Radius of the radio widget (accounting for border)
    const maxBarLength = 20; // Maximum length of audio bars extending inward
    const numBars = 128; // Doubled number of audio bars for even smoother appearance
    const barWidth = 1; // Thinner bars to accommodate more bars

    // Set styles once before the loop
    ctx!.beginPath();
    ctx!.strokeStyle = '#5ec3ff88'; // Faded blue to match Halo theme
    ctx!.lineWidth = barWidth;
    ctx!.lineCap = 'round';

    // Draw audio bars around the inside edge of the circle, extending inward
    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * 2 * Math.PI;

      // Use only half the spectrum and mirror it
      const halfBars = numBars / 2;
      let dataIndex;
      if (i < halfBars) {
        // First half: use first half of audio spectrum
        dataIndex = Math.floor((i / halfBars) * (bufferLength / 2));
      } else {
        // Second half: mirror the first half
        const mirrorIndex = numBars - 1 - i;
        dataIndex = Math.floor((mirrorIndex / halfBars) * (bufferLength / 2));
      }

      const amplitude = (dataArray[dataIndex] / 255) * maxBarLength;

      // Ensure minimum bar length for visibility
      const minAmplitude = 3;
      const finalAmplitude = Math.max(amplitude, minAmplitude);

      // Calculate bar start and end positions
      // Start at the edge of the widget, extend inward toward center
      const startX = centerX + widgetRadius * Math.cos(angle);
      const startY = centerY + widgetRadius * Math.sin(angle);
      const endX = centerX + (widgetRadius - finalAmplitude) * Math.cos(angle);
      const endY = centerY + (widgetRadius - finalAmplitude) * Math.sin(angle);

      ctx!.moveTo(startX, startY);
      ctx!.lineTo(endX, endY);
    }

    // Single stroke call for all bars
    ctx!.stroke();
  }

  draw();
}

function stopVisualization() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
}

function startSpeakerTracking() {
  if (!audioElement) return;
  
  function updateSpeaker() {
    const currentTime = audioElement.currentTime;
    
    if (currentTime >= 0 && currentTime < 6) {
      // 0:00 to 0:07 is Master Chief
      if (currentSpeaker !== 'chief' && !isTransitioning) {
        transitionToSpeaker('chief');
      }
    } else if (currentTime >= 6 && currentTime < 31) {
      // 0:07 to 0:23 is Cortana
      if (currentSpeaker !== 'cortana' && !isTransitioning) {
        transitionToSpeaker('cortana');
      }
    } else if (currentTime >= 31) {
      // 0:23 to the end is Master Chief
      if (currentSpeaker !== 'chief' && !isTransitioning) {
        transitionToSpeaker('chief');
      }
    }
  }
  
  // Update speaker every 100ms
  speakerInterval = setInterval(updateSpeaker, 100);
  
  // Clean up interval when audio ends
  audioElement.addEventListener('ended', () => {
    clearInterval(speakerInterval);
  });
}

function transitionToSpeaker(newSpeaker: string) {
  if (isTransitioning || currentSpeaker === newSpeaker) return;
  
  isTransitioning = true;
  
  // Fade out current image
  const fadeOutDuration = 200; // 200ms fade out
  const fadeOutSteps = 20;
  const fadeOutInterval = fadeOutDuration / fadeOutSteps;
  
  let fadeOutStep = 0;
  fadeOutTimer = setInterval(() => {
    fadeOutStep++;
    fadeOpacity = 1 - (fadeOutStep / fadeOutSteps);

    if (fadeOutStep >= fadeOutSteps) {
      clearInterval(fadeOutTimer);

      // Switch speaker
      currentSpeaker = newSpeaker;

      // Fade in new image
      const fadeInDuration = 200; // 200ms fade in
      const fadeInSteps = 20;
      const fadeInInterval = fadeInDuration / fadeInSteps;

      let fadeInStep = 0;
      fadeInTimer = setInterval(() => {
        fadeInStep++;
        fadeOpacity = fadeInStep / fadeInSteps;

        if (fadeInStep >= fadeInSteps) {
          clearInterval(fadeInTimer);
          fadeOpacity = 1;
          isTransitioning = false;
        }
      }, fadeInInterval);
    }
  }, fadeOutInterval);
}

function handleMenuKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedItem = (selectedItem + 1) % menuItems.length;
    menuItemRefs[selectedItem]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedItem = (selectedItem - 1 + menuItems.length) % menuItems.length;
    menuItemRefs[selectedItem]?.focus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const link = menuItems[selectedItem]?.link;
    if (link) {
      window.location.href = link;
    }
  }
}

onMount(() => {
  // Read CRT mode from localStorage
  if (typeof window !== 'undefined') {
    crtMode = localStorage.getItem('crtMode') === 'true';

    // Listen for storage changes (in case user has multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crtMode') {
        crtMode = e.newValue === 'true';
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (audioElement) { audioElement.pause(); audioElement.src = ''; }
      if (audioContext) { audioContext.close(); }
      if (animationId) { cancelAnimationFrame(animationId); }
      if (speakerInterval) { clearInterval(speakerInterval); }
      if (fadeOutTimer) { clearInterval(fadeOutTimer); }
      if (fadeInTimer) { clearInterval(fadeInTimer); }
    };
  }
});
</script>

<svelte:head>
  <title>HaloPortfolio</title>
</svelte:head>

<div class="crt-toggle-bar">
  <button class="crt-toggle" on:click={toggleCrtMode} aria-pressed={crtMode}>
    CRT Mode: {crtMode ? 'On' : 'Off'}
  </button>
</div>

{#if videoAutoplayFailed}
  <div class="autoplay-notification">
    <div class="notification-content">
      <h3>🎬 Video Autoplay Disabled</h3>
      <p>To experience the full site, please:</p>
      <ul>
        <li>Turn off Low Power Mode (iOS)</li>
        <li>Allow autoplay in your browser settings</li>
        <li>Or click "Play Video" below</li>
      </ul>
      <div class="notification-buttons">
        <button class="notification-play" on:click={playVideo}>
          ▶️ Play Video
        </button>
        <button class="notification-close" on:click={() => {videoAutoplayFailed = false; hasCheckedAutoplay = true;}}>
          Got it
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Radio Widget -->
<div class="radio-widget {radioExpanded ? 'expanded' : ''}" role="button" tabindex="0" aria-label="Radio to Master Chief" on:click={toggleRadio} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRadio(); } }}>
  <svg class="radio-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Walkie-talkie body -->
    <rect x="6" y="4" width="12" height="16" rx="2" fill="#5ec3ff"/>
    <!-- Antenna -->
    <line x1="12" y1="4" x2="12" y2="2" stroke="#5ec3ff" stroke-width="2" stroke-linecap="round"/>
    <!-- Speaker grille -->
    <circle cx="12" cy="8" r="2" fill="#1976d2"/>
    <circle cx="12" cy="8" r="1" fill="#5ec3ff"/>
    <!-- Control buttons -->
    <rect x="9" y="12" width="2" height="2" rx="0.5" fill="#1976d2"/>
    <rect x="13" y="12" width="2" height="2" rx="0.5" fill="#1976d2"/>
    <!-- LED indicator -->
    <circle cx="12" cy="16" r="0.5" fill="#00ff88"/>
    <!-- Side grip -->
    <rect x="5" y="6" width="1" height="12" rx="0.5" fill="#1976d2"/>
    <rect x="18" y="6" width="1" height="12" rx="0.5" fill="#1976d2"/>
  </svg>
  <div class="radio-pulse" class:hidden={radioExpanded}></div>
  
  <!-- Speaker Profile -->
  <div class="speaker-profile">
    <img src={currentSpeaker === 'chief' ? '/master_chief.webp' : '/cortana.webp'}
         alt={currentSpeaker === 'chief' ? 'Master Chief' : 'Cortana'}
         class="speaker-image"
         style="opacity: {fadeOpacity};"
         loading="lazy"
         decoding="async"
         width="120"
         height="120" />
    <canvas id="waveform-canvas" class="waveform-canvas" width="120" height="120"></canvas>
  </div>
</div>

{#if crtMode}
  <div class="crt-background">
    <div class="tv-frame">
      <div class="crt-overlay"></div>
      <video autoplay loop muted playsinline preload="metadata" class="background-video" on:loadeddata={handleVideoLoad} on:error={() => {if (!hasCheckedAutoplay) {hasCheckedAutoplay = true; videoAutoplayFailed = true;}}}>
        <source src="/menu_background.webm" type="video/webm" />
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
        {#each menuItems as item, i}
          <li bind:this={menuItemRefs[i]} tabindex="0" on:keydown={handleMenuKeyDown} class:menu-selected={selectedItem === i}><a href={item.link}>{item.label}</a></li>
        {/each}
      </ul>
      <div class="tv-stand"></div>
      <div class="tv-base"></div>
    </div>
  </div>
{:else}
  <div class="halo-bg">
    <video autoplay loop muted playsinline preload="metadata" class="background-video" on:loadeddata={handleVideoLoad} on:error={() => {if (!hasCheckedAutoplay) {hasCheckedAutoplay = true; videoAutoplayFailed = true;}}}>
      <source src="/menu_background.webm" type="video/webm" />
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
      {#each menuItems as item, i}
        <li bind:this={menuItemRefs[i]} tabindex="0" on:keydown={handleMenuKeyDown} class:menu-selected={selectedItem === i}><a href={item.link}>{item.label}</a></li>
      {/each}
    </ul>
  </div>
{/if}

<style>
.crt-toggle-bar {
  width: 100%;
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
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid #5ec3ff;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 400px;
  width: 90vw;
  box-shadow: 0 0 32px #5ec3ff88;
  backdrop-filter: blur(10px);
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
  flex-direction: column;
  gap: 0.75rem;
}

.notification-play {
  background: #00ff88;
  color: #181818;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.notification-play:hover {
  background: #00cc6a;
}

.notification-close {
  background: #5ec3ff;
  color: #181818;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.notification-close:hover {
  background: #fff;
}

/* Radio Widget */
.radio-widget {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #5ec3ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: width 0.5s ease, height 0.5s ease, border-color 0.3s ease;
  backdrop-filter: blur(10px);
  overflow: visible;
}

.radio-widget.expanded {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  justify-content: center;
  padding: 0;
}

.radio-widget.expanded .radio-icon {
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.radio-widget:hover {
  transform: scale(1.1);
  border-color: #fff;
}

.radio-widget:focus {
  outline: none;
  box-shadow: 0 0 0 3px #fff;
}

.radio-icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 8px #5ec3ff88);
  transition: filter 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
}

.radio-widget:hover .radio-icon {
  filter: drop-shadow(0 0 12px #5ec3ffcc);
}

.radio-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 2px solid #5ec3ff;
  border-radius: 50%;
  animation: radio-pulse 2s infinite;
  opacity: 0;
  box-sizing: border-box;
  pointer-events: none;
}

.radio-pulse.hidden {
  display: none;
}

@keyframes radio-pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.speaker-profile {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
}

.radio-widget.expanded .speaker-profile {
  opacity: 1;
}

.speaker-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.waveform-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: transparent;
  z-index: 3;
  pointer-events: none;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .radio-widget {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 50px;
    height: 50px;
  }
  
  .radio-widget.expanded {
    width: 80px;
    height: 80px;
  }
  
  .radio-icon {
    width: 28px;
    height: 28px;
  }
  
  /* Adjust pulse animation for mobile */
  .radio-pulse {
    border-width: 1px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    box-sizing: border-box;
  }
  
  @keyframes radio-pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.8;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.3);
      opacity: 0;
    }
  }
}
/* CRT TV styles (reuse from projects page) */
.crt-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
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
  width: 100%;
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
  width: 100%;
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
