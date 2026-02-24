<script lang="ts">
  import { onMount } from 'svelte';

  export let audioSrc: string;
  export let initialSpeaker: 'chief' | 'cortana';
  export let speakerTimings: Array<{time: number, speaker: string}>;
  export let position: 'left' | 'right';
  export let resetOnEnd: boolean;

  let radioExpanded = false;
  let audioContext: AudioContext;
  let analyser: AnalyserNode;
  let audioSource: MediaElementAudioSourceNode;
  let animationId: number;
  let currentSpeaker = initialSpeaker;
  let audioElement: HTMLAudioElement;
  let fadeOpacity = 1;
  let isTransitioning = false;
  let speakerIntervalId: number;
  let fadeTimeoutId: number;
  let canvasElement: HTMLCanvasElement;

  function toggleRadio() {
    if (!radioExpanded) {
      currentSpeaker = initialSpeaker;
      fadeOpacity = 1;

      audioElement = new Audio(audioSrc);

      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      audioSource = audioContext.createMediaElementSource(audioElement);
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);

      audioElement.play().then(() => {
        radioExpanded = true;
        startVisualization();
        startSpeakerTracking();
      }).catch(() => {});

      audioElement.addEventListener('ended', () => {
        radioExpanded = false;
        stopVisualization();
        if (resetOnEnd) {
          currentSpeaker = initialSpeaker;
        }
      });
    } else {
      radioExpanded = false;
      stopVisualization();
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      if (audioContext) {
        audioContext.close();
      }
    }
  }

  function startVisualization() {
    const canvas = canvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const widgetRadius = canvas.width / 2 - 2;
    const maxBarLength = 20;
    const numBars = 64;
    const halfBars = numBars / 2;
    const minAmplitude = 3;

    const cosAngles = new Float32Array(numBars);
    const sinAngles = new Float32Array(numBars);
    const dataIndices = new Uint8Array(numBars);

    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * 2 * Math.PI;
      cosAngles[i] = Math.cos(angle);
      sinAngles[i] = Math.sin(angle);
      if (i < halfBars) {
        dataIndices[i] = Math.floor((i / halfBars) * (bufferLength / 2));
      } else {
        const mirrorIndex = numBars - 1 - i;
        dataIndices[i] = Math.floor((mirrorIndex / halfBars) * (bufferLength / 2));
      }
    }

    ctx.strokeStyle = '#5ec3ff88';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    function draw() {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      for (let i = 0; i < numBars; i++) {
        const finalAmplitude = Math.max((dataArray[dataIndices[i]] / 255) * maxBarLength, minAmplitude);
        const cos = cosAngles[i];
        const sin = sinAngles[i];
        ctx.moveTo(centerX + widgetRadius * cos, centerY + widgetRadius * sin);
        ctx.lineTo(centerX + (widgetRadius - finalAmplitude) * cos, centerY + (widgetRadius - finalAmplitude) * sin);
      }
      ctx.stroke();
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

      let targetSpeaker = speakerTimings[0]?.speaker || initialSpeaker;
      for (let i = speakerTimings.length - 1; i >= 0; i--) {
        if (currentTime >= speakerTimings[i].time) {
          targetSpeaker = speakerTimings[i].speaker;
          break;
        }
      }

      if (currentSpeaker !== targetSpeaker && !isTransitioning) {
        transitionToSpeaker(targetSpeaker);
      }
    }

    speakerIntervalId = window.setInterval(updateSpeaker, 100);

    audioElement.addEventListener('ended', () => {
      clearInterval(speakerIntervalId);
    });
  }

  function transitionToSpeaker(newSpeaker: string) {
    if (isTransitioning || currentSpeaker === newSpeaker) return;

    isTransitioning = true;
    clearTimeout(fadeTimeoutId);

    fadeOpacity = 0;

    fadeTimeoutId = window.setTimeout(() => {
      currentSpeaker = newSpeaker;

      fadeTimeoutId = window.setTimeout(() => {
        fadeOpacity = 1;

        fadeTimeoutId = window.setTimeout(() => {
          isTransitioning = false;
        }, 200);
      }, 20);
    }, 200);
  }

  onMount(() => {
    return () => {
      clearInterval(speakerIntervalId);
      clearTimeout(fadeTimeoutId);
      if (animationId) cancelAnimationFrame(animationId);
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      if (audioContext) audioContext.close();
    };
  });
</script>

<div class="radio-widget position-{position} {radioExpanded ? 'expanded' : ''}" role="button" tabindex="0" aria-label="Radio to Master Chief and Cortana" on:click={toggleRadio}>
  <svg class="radio-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="12" height="16" rx="2" fill="#5ec3ff"/>
    <line x1="12" y1="4" x2="12" y2="2" stroke="#5ec3ff" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="8" r="2" fill="#1976d2"/>
    <circle cx="12" cy="8" r="1" fill="#5ec3ff"/>
    <rect x="9" y="12" width="2" height="2" rx="0.5" fill="#1976d2"/>
    <rect x="13" y="12" width="2" height="2" rx="0.5" fill="#1976d2"/>
    <circle cx="12" cy="16" r="0.5" fill="#00ff88"/>
    <rect x="5" y="6" width="1" height="12" rx="0.5" fill="#1976d2"/>
    <rect x="18" y="6" width="1" height="12" rx="0.5" fill="#1976d2"/>
  </svg>
  <div class="radio-pulse" class:hidden={radioExpanded}></div>

  <div class="speaker-profile">
    <img src={currentSpeaker === 'chief' ? '/master_chief.webp' : '/cortana.webp'}
         alt={currentSpeaker === 'chief' ? 'Master Chief' : 'Cortana'}
         class="speaker-image"
         style="opacity: {fadeOpacity};" />
    <canvas bind:this={canvasElement} class="waveform-canvas" width="120" height="120"></canvas>
  </div>
</div>

<style>
.radio-widget {
  position: fixed;
  bottom: 2rem;
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
  transition: width 0.5s ease, height 0.5s ease, border-color 0.5s ease;
  overflow: visible;
}

.radio-widget.position-left {
  left: 2rem;
  transform-origin: left center;
}

.radio-widget.position-right {
  right: 2rem;
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
  width: 70px;
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
  transition: opacity 200ms ease;
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

@media (max-width: 768px) {
  .radio-widget {
    bottom: 1.5rem;
    width: 50px;
    height: 50px;
  }

  .radio-widget.position-left {
    left: 1.5rem;
  }

  .radio-widget.position-right {
    right: 1.5rem;
  }

  .radio-widget.expanded {
    width: 80px;
    height: 80px;
  }

  .radio-icon {
    width: 28px;
    height: 28px;
  }

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
</style>
