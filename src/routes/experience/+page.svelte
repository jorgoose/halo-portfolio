<script lang="ts">
  import { onMount } from 'svelte';
  
  let crtMode = false;

  // Radio widget variables
  let radioExpanded = false;
  let audioContext: AudioContext;
  let analyser: AnalyserNode;
  let audioSource: MediaElementAudioSourceNode;
  let animationId: number;
  let currentSpeaker = 'chief'; // 'chief' or 'cortana' - starts with Chief
  let audioElement: HTMLAudioElement;
  let fadeOpacity = 1; // For smooth transitions
  let isTransitioning = false;
  let speakerIntervalId: number;
  let fadeTimeoutId: number;

  // Experience sections data
  const experienceSections = [
    {
      title: 'ASSOCIATE SOFTWARE ENGINEER',
      content: `🏢 Company: Capital One
🗓️ August 2024 - Present
📍 Chicago, IL

Building and maintaining financial software applications that serve millions of customers. Working with modern technologies including Go, Python, and AWS to develop scalable backend systems and APIs. Collaborating with cross-functional teams to deliver high-quality solutions in a fast-paced enterprise environment.

Tech Stack: Go, Python, AWS`
    },
    {
      title: 'FOUNDER',
      content: `🏢 Company: EveryNetNet
🗓️ December 2023 - August 2024
📍 Ames, IA

Founded and developed an investment research service focused on net-net companies (stocks trading below net current asset value). Built the entire platform from conception to launch, including web application, backend APIs, and data processing systems. Integrated payment processing and cloud infrastructure to serve investment research clients.

Tech Stack: React, Google Cloud, Puppeteer, Stripe API`
    },
    {
      title: 'SOFTWARE ENGINEER INTERN',
      content: `🏢 Company: FloVision Solutions
🗓️ February 2024 - May 2024
📍 Ames, IA

Developed computer vision and image processing solutions using Python and OpenCV. Worked on automated systems for visual inspection and quality control applications. Gained hands-on experience with machine learning algorithms and real-time image processing pipelines.

Tech Stack: Python, OpenCV, AWS`
    },
    {
      title: 'PEER MENTOR',
      content: `🏢 Company: Iowa State University
🗓️ August 2023 - March 2024
📍 Ames, IA

Mentored incoming Computer Science students through their transition to university and the CS program. Provided academic guidance, organized study groups, and helped students navigate course selection and career planning. Facilitated workshops on programming fundamentals and effective study strategies.

Skills: Git, Mentoring, Leadership`
    },
    {
      title: 'SOFTWARE ENGINEER INTERN',
      content: `🏢 Company: Capital One
🗓️ June 2023 - August 2023
📍 New York, NY

Developed and maintained financial software applications serving millions of customers. Worked on backend APIs and frontend components using modern development practices. Participated in code reviews, testing, and deployment processes while learning enterprise-scale software development in the financial technology sector.

Tech Stack: Python, AWS, Jenkins, Locust`
    },
    {
      title: 'SOFTWARE ENGINEER INTERN',
      content: `🏢 Company: Setwise Technology
🗓️ May 2022 - October 2022
📍 Ames, IA

Developed web applications and backend systems using PHP and Laravel framework. Worked on database design and implementation, API development, and frontend integration. Gained experience with full-stack development practices and agile software development methodologies.

Tech Stack: PHP, Laravel, Vue.js`
    },
    {
      title: 'SOFTWARE ENGINEER INTERN',
      content: `🏢 Company: Capital One
🗓️ June 2022 - August 2022
📍 McLean, VA

Developed financial software applications and backend systems. Worked with Python, Go, and PostgreSQL to build scalable solutions. Gained experience with enterprise development practices including Git version control, FastAPI framework, and automated testing with Lit framework.

Tech Stack: Python, Go, Git, PostgreSQL, FastAPI, Lit`
    },
    {
      title: 'IT SUPPORT SPECIALIST',
      content: `🏢 Company: Iowa State University
🗓️ November 2021 - June 2022
📍 Ames, IA

Provided technical support and troubleshooting for university systems and student/faculty technology needs. Resolved hardware and software issues, managed help desk tickets, and delivered excellent customer service. Developed strong problem-solving and communication skills in a fast-paced support environment.

Skills: Troubleshooting, Technical Communication, Customer Service`
    },
    {
      title: 'DELIVERY DRIVER',
      content: `🏢 Company: DoorDash
🗓️ February 2021 - November 2021
📍 Ames, IA

Provided reliable food delivery services while maintaining excellent customer satisfaction ratings. Managed time efficiently to handle multiple orders and optimize delivery routes. Developed strong customer service skills and experience with mobile app-based work platforms.

Skills: Customer Service, Time Management, Problem Solving`
    }
  ];

  let selectedSection = 0;
  let menuRefs: HTMLElement[] = [];

  function selectSection(idx: number) {
    selectedSection = idx;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      selectedSection = (selectedSection - 1 + experienceSections.length) % experienceSections.length;
      menuRefs[selectedSection]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      selectedSection = (selectedSection + 1) % experienceSections.length;
      menuRefs[selectedSection]?.focus();
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // Already selected on focus
      e.preventDefault();
    }
  }

  // Radio widget functions
  function toggleRadio() {
    if (!radioExpanded) {
      // Reset to starting speaker for new audio session
      currentSpeaker = 'chief';
      fadeOpacity = 1;
      
      // Start playing audio and expand
      audioElement = new Audio('/audio/experience_cortana_and_chief.mp3');
      
      // Initialize audio context for visualization
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
      
      // Start playing
      audioElement.play().then(() => {
        radioExpanded = true;
        startVisualization();
        startSpeakerTracking();
      }).catch(() => {
      });
      
      // Listen for audio end
      audioElement.addEventListener('ended', () => {
        radioExpanded = false;
        stopVisualization();
        // Don't reset currentSpeaker immediately - let it maintain state during collapse
        // It will reset when the widget is clicked again
      });
    } else {
      // Stop audio and collapse
      radioExpanded = false;
      stopVisualization();
      if (audioContext) {
        audioContext.close();
      }
    }
  }

  function startVisualization() {
    const canvas = document.getElementById('waveform-canvas') as HTMLCanvasElement;
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

      if (currentTime >= 0 && currentTime < 5) {
        if (currentSpeaker !== 'chief' && !isTransitioning) {
          transitionToSpeaker('chief');
        }
      } else if (currentTime >= 5 && currentTime < 23) {
        if (currentSpeaker !== 'cortana' && !isTransitioning) {
          transitionToSpeaker('cortana');
        }
      } else if (currentTime >= 23 && currentTime < 25) {
        if (currentSpeaker !== 'chief' && !isTransitioning) {
          transitionToSpeaker('chief');
        }
      } else if (currentTime >= 25 && currentTime < 32) {
        if (currentSpeaker !== 'cortana' && !isTransitioning) {
          transitionToSpeaker('cortana');
        }
      } else if (currentTime >= 32) {
        if (currentSpeaker !== 'chief' && !isTransitioning) {
          transitionToSpeaker('chief');
        }
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
        clearInterval(speakerIntervalId);
        clearTimeout(fadeTimeoutId);
        if (animationId) cancelAnimationFrame(animationId);
        if (audioElement) {
          audioElement.pause();
          audioElement.src = '';
        }
        if (audioContext) audioContext.close();
      };
    }
  });
</script>

<svelte:head>
  <title>Experience | HaloPortfolio</title>
</svelte:head>

{#if crtMode}
  <div class="crt-background">
    <div class="tv-frame">
      <div class="crt-overlay"></div>
      <video autoplay loop muted playsinline preload="metadata" class="background-video">
        <source src="/menu_background.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div class="experience-header">Experience</div>
      <div class="menu-bar advanced-menu">
        <div class="menu-vertical">
          <div class="menu-list">
            {#each experienceSections as section, idx}
              <div
                class="menu-item {selectedSection === idx ? 'selected' : ''}"
                bind:this={menuRefs[idx]}
                tabindex="0"
                role="button"
                aria-selected={selectedSection === idx}
                on:click={() => selectSection(idx)}
                on:keydown={handleKeyDown}
                >
                {section.title}
              </div>
            {/each}
          </div>
          <div class="menu-content">
            <div class="section-text">{experienceSections[selectedSection].content}</div>
          </div>
        </div>
        <div class="experience-icon-area">
          <svg viewBox="0 0 120 120" aria-hidden="true" class="experience-icon-svg" style="filter: drop-shadow(0 0 18px #5ec3ff88);">
            <defs>
              <radialGradient id="experienceIconGradient" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#5ec3ff" stop-opacity="0.7" />
                <stop offset="70%" stop-color="#5ec3ff" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#1976d2" stop-opacity="0.18" />
              </radialGradient>
              <linearGradient id="workHighlight" x1="60" y1="30" x2="60" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#fff" stop-opacity="0.7" />
                <stop offset="100%" stop-color="#5ec3ff" stop-opacity="0.2" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" stroke="#5ec3ff" stroke-width="8" fill="url(#experienceIconGradient)" />
            <!-- Briefcase icon -->
            <rect x="35" y="45" width="50" height="35" rx="4" stroke="#5ec3ff" stroke-width="3" fill="none" />
            <rect x="40" y="40" width="40" height="8" rx="2" stroke="#5ec3ff" stroke-width="2" fill="none" />
            <line x1="50" y1="55" x2="70" y2="55" stroke="#5ec3ff" stroke-width="2" />
            <line x1="50" y1="65" x2="70" y2="65" stroke="#5ec3ff" stroke-width="2" />
          </svg>
        </div>
      </div>
      <div class="back-row">
        <div class="back-label interactive" tabindex="0" role="button" aria-label="Back" on:click={() => history.back()}>= BACK</div>
      </div>
      <div class="tv-stand"></div>
      <div class="tv-base"></div>
    </div>
  </div>
{:else}
  <div class="experience-bg">
    <video autoplay loop muted playsinline preload="metadata" class="background-video">
      <source src="/menu_background.webm" type="video/webm" />
      Your browser does not support the video tag.
    </video>
    <div class="experience-header">Experience</div>
    <div class="menu-bar advanced-menu">
      <div class="menu-vertical">
        <div class="menu-list">
          {#each experienceSections as section, idx}
            <div
              class="menu-item {selectedSection === idx ? 'selected' : ''}"
              bind:this={menuRefs[idx]}
              tabindex="0"
              role="button"
              aria-selected={selectedSection === idx}
              on:click={() => selectSection(idx)}
              on:keydown={handleKeyDown}
              >
              {section.title}
            </div>
          {/each}
        </div>
        <div class="menu-content">
          <div class="section-text">{experienceSections[selectedSection].content}</div>
        </div>
      </div>
      <div class="experience-icon-area">
        <svg viewBox="0 0 120 120" aria-hidden="true" class="experience-icon-svg" style="filter: drop-shadow(0 0 18px #5ec3ff88);">
          <defs>
            <radialGradient id="experienceIconGradient" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#5ec3ff" stop-opacity="0.7" />
              <stop offset="70%" stop-color="#5ec3ff" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#1976d2" stop-opacity="0.18" />
            </radialGradient>
            <linearGradient id="workHighlight" x1="60" y1="30" x2="60" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.7" />
              <stop offset="100%" stop-color="#5ec3ff" stop-opacity="0.2" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="54" stroke="#5ec3ff" stroke-width="8" fill="url(#experienceIconGradient)" />
          <!-- Briefcase icon -->
          <rect x="35" y="45" width="50" height="35" rx="4" stroke="#5ec3ff" stroke-width="3" fill="none" />
          <rect x="40" y="40" width="40" height="8" rx="2" stroke="#5ec3ff" stroke-width="2" fill="none" />
          <line x1="50" y1="55" x2="70" y2="55" stroke="#5ec3ff" stroke-width="2" />
          <line x1="50" y1="65" x2="70" y2="65" stroke="#5ec3ff" stroke-width="2" />
        </svg>
      </div>
    </div>
    <div class="back-row">
      <div class="back-label interactive" tabindex="0" role="button" aria-label="Back" on:click={() => history.back()}>= BACK</div>
    </div>
  </div>
{/if}

<!-- Radio Widget -->
<div class="radio-widget {radioExpanded ? 'expanded' : ''}" role="button" tabindex="0" aria-label="Radio to Master Chief and Cortana" on:click={toggleRadio}>
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
         style="opacity: {fadeOpacity};" />
    <canvas id="waveform-canvas" class="waveform-canvas" width="120" height="120"></canvas>
  </div>
</div>

<style>
html, body {
  max-width: 100vw;
  overflow-x: hidden;
  overflow-y: hidden;
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #222 60%, #111 100%) fixed, url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="%23111111"/><circle cx="50" cy="50" r="40" fill="%23222222" fill-opacity="0.08"/></svg>');
  background-blend-mode: multiply;
  background-size: cover;
  background-repeat: repeat;
}

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
  justify-content: flex-start;
  box-sizing: border-box;
  z-index: 2;
}

.crt-overlay {
  pointer-events: none;
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  z-index: 5;
  border-radius: inherit;
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

.experience-bg {
  min-height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  max-width: 100vw;
  overflow: hidden;
}

.background-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

.experience-header {
  position: relative;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(1.5rem, 8vw, 3.8rem);
  color: #5ec3ff;
  letter-spacing: 0.15em;
  z-index: 2;
  text-shadow: 0 0 8px #5ec3ff88, 0 0 2px #fff8;
  text-transform: uppercase;
  text-align: left;
  margin-top: clamp(0.5rem, 3vh, 2.5rem);
  margin-bottom: clamp(0.1rem, 1vh, 0.3rem);
  margin-left: 20%;
  padding-left: 0;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.menu-bar {
  width: 100%;
  height: 0;
  flex: 1;
  min-height: 0;
  background: rgba(10, 20, 40, 0.85);
  border-top: clamp(1px, 0.3vh, 3px) solid #1976d2;
  border-bottom: clamp(1px, 0.3vh, 3px) solid #1976d2;
  border-left: none;
  border-right: none;
  border-radius: 0;
  box-shadow: 0 0 32px #1976d288, 0 0 2px #fff8;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  z-index: 1;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.section-text {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(0.8rem, 2vh, 1.2rem);
  color: #5ec3ff;
  opacity: 0.9;
  line-height: 1.6;
  text-align: left;
  margin: 0;
}

.back-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  gap: clamp(1rem, 3vw, 2rem);
  margin-top: clamp(0.5rem, 2vh, 1.5rem);
  box-sizing: border-box;
  flex-shrink: 0;
  padding-right: 4%;
}

.back-label {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(1rem, 3vh, 2rem);
  color: #5ec3ff;
  letter-spacing: 0.12em;
  text-shadow: 0 0 8px #5ec3ff88, 0 0 2px #fff8;
  text-transform: uppercase;
  outline: none;
  transition: color 0.2s;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  text-align: right;
  cursor: pointer;
}

.back-label:focus, .back-label:hover {
  color: #fff;
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
  
  .experience-header {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    padding-left: 4%;
  }
}

@media (max-width: 700px) {
  html, body {
    max-width: 100vw;
    overflow-x: hidden;
    overflow-y: hidden;
    height: 100vh;
  }
  
  .crt-background {
    background: url('/CRT_bg.jpeg') 47.5% 55.75% no-repeat;
    background-size: 255%;
    height: 100vh;
    overflow: hidden;
  }
  
  .tv-frame {
    width: 98vw;
    max-width: 100vw;
    min-width: 0;
    aspect-ratio: 4 / 3;
    border-width: 6px;
    border-radius: 1.2rem;
    box-shadow: 0 0 24px 2px #00bfff33, 0 0 0 12px #222b, 0 4px 16px #000c, 0 0 0 1px #222 inset;
    height: auto;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
  }
  
  .tv-frame::before {
    border-radius: 1rem;
  }
  
  .tv-frame::after {
    border-radius: 0.9rem;
  }
  
  .crt-overlay {
    border-radius: 1rem;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
  }
  
  .background-video {
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
    width: 90px;
    height: 10px;
    border-radius: 0 0 18px 18px / 0 0 6px 6px;
    top: calc(100% + 8px);
    left: 50%;
    transform: translate(-50%, 0);
  }
  
  .tv-base::before {
    height: 2px;
    border-radius: 1px;
  }
  
  .experience-header {
    font-size: clamp(1.2rem, 4vw, 2rem);
    margin-left: 6vw;
    margin-top: clamp(0.3rem, 2vh, 1rem);
    margin-bottom: clamp(0.1rem, 1vh, 0.5rem);
  }
  
  .menu-bar {
    padding: clamp(0.3rem, 1vh, 0.8rem);
    max-width: 100%;
    flex: 1;
    min-height: 0;
  }
  
  .back-row {
    gap: 0.5rem;
    margin-top: clamp(0.3rem, 1vh, 0.8rem);
    padding-right: 2%;
    flex-shrink: 0;
  }
  
  .back-label {
    font-size: clamp(0.9rem, 3vw, 1.2rem);
  }
  
  .menu-item {
    font-size: clamp(0.6rem, 2.5vw, 0.9rem);
    padding: clamp(0.15rem, 0.5vh, 0.25rem) clamp(0.3rem, 1vw, 0.5rem);
    margin: clamp(0.05rem, 0.2vh, 0.1rem) 0;
  }
  
  .menu-content,
  .section-text {
    font-size: clamp(0.5rem, 2vw, 0.85rem);
    padding: clamp(0.5rem, 1.5vh, 1rem) 0;
    line-height: 1.3;
  }
  
  .menu-vertical {
    height: auto;
    flex: 1;
    min-height: 0;
    padding-left: 0.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .menu-list {
    flex-shrink: 0;
    gap: clamp(0.1rem, 0.3vh, 0.18rem);
  }
  
  .menu-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: clamp(0.5rem, 1vh, 1rem) 0 clamp(0.3rem, 1vh, 0.8rem) 0;
  }
  
  .experience-icon-area {
    display: none;
  }
  
  .tv-frame .menu-bar,
  .tv-frame .advanced-menu {
    width: 100%;
    max-width: 100%;
    margin: 0;
    left: 0;
    right: 0;
    box-sizing: border-box;
    flex: 1;
    min-height: 0;
  }
  
  .tv-frame .menu-vertical {
    padding-left: 2rem;
    padding-right: 2rem;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
    flex: 1;
    min-height: 0;
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    overflow-x: hidden;
    margin-left: 0;
  }
  
  .tv-frame .menu-list,
  .tv-frame .menu-content {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .tv-frame .menu-item {
    font-size: clamp(0.5rem, 2vw, 0.7rem);
    padding: clamp(0.08rem, 0.3vh, 0.12rem) clamp(0.15rem, 0.8vw, 0.2rem);
    margin: clamp(0.02rem, 0.1vh, 0.05rem) 0;
  }
  
  .tv-frame .section-text {
    font-size: clamp(0.45rem, 1.8vw, 0.7rem);
    padding: clamp(0.3rem, 0.8vh, 0.5rem) 0;
    line-height: 1.2;
  }
  
  .experience-bg .menu-item {
    font-size: clamp(0.6rem, 2.2vw, 0.8rem);
    padding: clamp(0.12rem, 0.5vh, 0.18rem) clamp(0.25rem, 1vw, 0.4rem);
  }
  
  .experience-bg .menu-list {
    gap: clamp(0.1rem, 0.3vh, 0.18rem);
  }
  
  /* Mobile-specific CRT scrollbar styling */
  .tv-frame .menu-vertical::-webkit-scrollbar,
  .tv-frame .advanced-menu::-webkit-scrollbar {
    width: 6px;
  }

  .tv-frame .menu-vertical::-webkit-scrollbar-track,
  .tv-frame .advanced-menu::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }

  .tv-frame .menu-vertical::-webkit-scrollbar-thumb,
  .tv-frame .advanced-menu::-webkit-scrollbar-thumb {
    background: #5ec3ff;
    border-radius: 3px;
    box-shadow: 0 0 4px #5ec3ff88;
  }

  .tv-frame .menu-vertical::-webkit-scrollbar-thumb:hover,
  .tv-frame .advanced-menu::-webkit-scrollbar-thumb:hover {
    background: #fff;
  }

  /* Mobile CRT content styling */
  .tv-frame .menu-content {
    padding-left: 0;
    padding-right: 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  .tv-frame .menu-list {
    padding-right: 0.5rem;
    overflow-x: hidden;
  }

  .tv-frame .experience-header {
    padding-left: 2rem;
    padding-right: 2rem;
    margin-left: 0;
  }

  .tv-frame .advanced-menu {
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
    overflow-x: hidden;
  }
}

@media (max-width: 1000px) {
  .tv-frame {
    width: 98vw;
    max-width: 100vw;
    border-width: 6px;
    border-radius: 1.2rem;
  }
  
  .experience-header {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    padding-left: 4%;
  }
  
  .experience-icon-area {
    display: none !important;
  }
}

.advanced-menu {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  background: rgba(10, 20, 40, 0.85);
  box-shadow: 0 0 32px #1976d288, 0 0 2px #fff8;
  border-top: clamp(1px, 0.3vh, 3px) solid #1976d2;
  border-bottom: clamp(1px, 0.3vh, 3px) solid #1976d2;
  border-radius: 0;
  padding: 0;
  justify-content: flex-start;
}

@media (min-width: 701px) {
  .advanced-menu {
    min-height: 0;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  /* Desktop non-CRT scrollbar styling */
  .advanced-menu::-webkit-scrollbar {
    width: 8px;
  }

  .advanced-menu::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .advanced-menu::-webkit-scrollbar-thumb {
    background: #5ec3ff;
    border-radius: 4px;
    box-shadow: 0 0 4px #5ec3ff88;
  }

  .advanced-menu::-webkit-scrollbar-thumb:hover {
    background: #fff;
  }
}

@media (max-width: 700px) {
  .advanced-menu {
    min-height: 0;
    flex: 1;
  }
}

.menu-vertical {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 1000px;
  margin-left: 10%;
  margin-right: 10%;
  padding: 0;
}

.menu-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin-top: 0.7rem;
  gap: 0.3rem;
  background: none;
  box-shadow: none;
  border: none;
}

.menu-item {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1.35rem;
  color: #5ec3ff;
  background: rgba(20, 30, 50, 0.7);
  border: 2.5px solid #1976d2;
  border-radius: 1.5rem;
  padding: 0.45rem 1.2rem;
  margin: 0.1rem 0;
  cursor: pointer;
  outline: none;
  transition: background 0.2s, color 0.2s, border 0.2s;
  user-select: none;
  position: relative;
  width: 100%;
  min-width: 0;
  text-align: left;
  box-sizing: border-box;
}

.menu-item.selected, .menu-item:focus {
  background: #0a223a;
  color: #fff;
  border: 2.5px solid #5ec3ff;
  box-shadow: 0 0 8px #5ec3ff88;
}

.menu-item:active {
  background: #1976d2;
  color: #fff;
}

.menu-content {
  background: none;
  border-radius: 0;
  box-shadow: none;
  padding: 2rem 0 2rem 0;
  min-height: 120px;
  color: #5ec3ff;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1.1rem;
  margin-bottom: 0;
  margin-top: 0;
  white-space: pre-line;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
}

/* Non-CRT mode: make menu wider */
:global(.experience-bg) .menu-vertical {
  max-width: 1000px;
}
:global(.experience-bg) .menu-list {
  max-width: 100%;
}

.experience-icon-area {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 100%;
  overflow: hidden;
  margin: auto;
}

.experience-icon-svg {
  width: 80%;
  max-width: 240px;
  height: auto;
  max-height: 80vh;
  opacity: 0.8;
  margin: 0 auto;
}

body > :last-child {
  margin-bottom: 0 !important;
}

/* CRT mode containment for Experience page */
.tv-frame .menu-bar,
.tv-frame .advanced-menu,
.tv-frame .menu-vertical,
.tv-frame .experience-icon-area {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.tv-frame .menu-vertical {
  padding-left: 2rem;
  padding-right: 2rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
  overflow-x: hidden;
}

.tv-frame .menu-content {
  padding-left: 0;
  padding-right: 0;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.tv-frame .menu-list {
  padding-right: 0.5rem;
  overflow-x: hidden;
}

.tv-frame .experience-header {
  padding-left: 2rem;
  padding-right: 2rem;
  margin-left: 0;
}

.tv-frame .advanced-menu {
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom scrollbar styling for CRT mode */
.tv-frame .menu-vertical::-webkit-scrollbar,
.tv-frame .advanced-menu::-webkit-scrollbar {
  width: 8px;
}

.tv-frame .menu-vertical::-webkit-scrollbar-track,
.tv-frame .advanced-menu::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.tv-frame .menu-vertical::-webkit-scrollbar-thumb,
.tv-frame .advanced-menu::-webkit-scrollbar-thumb {
  background: #5ec3ff;
  border-radius: 4px;
  box-shadow: 0 0 4px #5ec3ff88;
}

.tv-frame .menu-vertical::-webkit-scrollbar-thumb:hover,
.tv-frame .advanced-menu::-webkit-scrollbar-thumb:hover {
  background: #fff;
}

/* Radio Widget */
.radio-widget {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
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
  transform-origin: left center;
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

/* Mobile responsive for radio widget */
@media (max-width: 768px) {
  .radio-widget {
    bottom: 1.5rem;
    left: 1.5rem;
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
</style> 