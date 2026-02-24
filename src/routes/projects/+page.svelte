<script lang="ts">
  import { onMount } from 'svelte';
  import RadioWidget from '$lib/RadioWidget.svelte';
  

  let resizeRafId: number;
  const projects = [
    { title: 'Hachiko', image: '/projects/hachiko-logo.jpg', description: 'Developer-friendly platform making Japanese financial data accessible through clean APIs and structured datasets. Transforms complex FSA disclosures into usable formats for developers. Streamlines access to market data. Built with SvelteKit, Rust, and Go.' },
    { title: 'EveryNetNet', image: '/projects/everynetnet-logo.jpg', description: 'Investment research SaaS for finding net-net companies trading below net current asset value. Helps investors discover undervalued opportunities in the market through comprehensive screening tools and analysis. Built with Next.js, Go, Google Cloud Platform, and Stripe API.' },
    { title: 'Frogstagram', image: '/projects/frogstagrame.jpg', description: 'Instagram-inspired platform with a twist: only allows frog photos. Uses AWS services and computer vision to automatically filter uploads, ensuring only frog images make it to the feed. Built with Python, FastAPI, AWS, SvelteKit, Tailwind CSS, and Docker.' },
    { title: 'Marketmon', image: '/projects/marketmon.png', description: 'Web-based trading card game that combines monster battles with real-time S&P 500 financial data for educational gameplay. Players learn finance and investing through engaging card mechanics. Built with Svelte, TypeScript, Tailwind CSS, Python, Claude API, and Stability API.' },
    { title: 'Pokemon Image Classifier', image: '/projects/pkmn.jpeg', description: 'Machine learning project that trains an image classification model to identify different Pokémon species from uploaded images. Uses deep learning and computer vision techniques for accurate recognition. Built with TensorFlow, Keras, and Python.' },
    { title: 'FinTeach', image: '/projects/finteach.jpg', description: 'Engaging educational app designed to make financial learning accessible and fun for young students through interactive lessons and gamified experiences. Teaches essential money management skills and financial literacy concepts. Built with Dart, Flutter, and OpenAI API.' }
  ];
  let start = 0;
  let visibleCount = 3;
  let selected = 0; // index of highlighted card in visibleProjects
  let levelSelectRow: HTMLElement;
  let isMobile = false;
  let crtMode = false;

  function updateIsMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth <= 700;
    }
  }

  function prev() {
    if (start > 0) start -= 1;
  }
  function next() {
    if (start + visibleCount < projects.length) start += 1;
  }
  
  $: visibleProjects = isMobile ? projects : projects.slice(start, start + visibleCount);

  onMount(() => {
    // Robustly read CRT mode from localStorage
    if (typeof window !== 'undefined') {
      crtMode = localStorage.getItem('crtMode') === 'true';
    } else {
      crtMode = false;
    }
    
    // Listen for storage changes (in case user has multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crtMode') {
        crtMode = e.newValue === 'true';
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    updateIsMobile();

    function throttledResize() {
      if (resizeRafId) return;
      resizeRafId = requestAnimationFrame(() => {
        updateIsMobile();
        resizeRafId = 0;
      });
    }
    window.addEventListener('resize', throttledResize);

    // Position Project 1 at the left edge on mobile
    if (isMobile && levelSelectRow) {
      setTimeout(() => {
        levelSelectRow.scrollLeft = 0;
      }, 100);
    }
    
    // Also reset scroll position when mobile state changes
    const resetScroll = () => {
      if (isMobile && levelSelectRow) {
        levelSelectRow.scrollLeft = 0;
      }
    };
    
    // Reset scroll when mobile state changes
    $: if (isMobile && levelSelectRow) {
      setTimeout(resetScroll, 50);
    }

    // Keyboard navigation
    function handleKeyDown(e: KeyboardEvent) {
      if (!isMobile) {
        // Desktop: highlight and shift carousel
        if (e.key === 'ArrowLeft') {
          if (selected > 0) {
            selected -= 1;
          } else if (start > 0) {
            prev();
            // keep highlight on first card
          }
        } else if (e.key === 'ArrowRight') {
          if (selected < visibleCount - 1 && selected < visibleProjects.length - 1) {
            selected += 1;
          } else if (start + visibleCount < projects.length) {
            next();
            // keep highlight on last card
          }
        }
      } else if (levelSelectRow) {
        // Mobile: highlight and scroll
        const cardWidth = 280 + 19.2;
        if (e.key === 'ArrowLeft') {
          if (selected > 0) {
            selected -= 1;
            // Scroll if needed
            const card = levelSelectRow.children[selected] as HTMLElement;
            if (card && card.offsetLeft < levelSelectRow.scrollLeft) {
              levelSelectRow.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            }
          }
        } else if (e.key === 'ArrowRight') {
          if (selected < visibleProjects.length - 1) {
            selected += 1;
            // Scroll if needed
            const card = levelSelectRow.children[selected] as HTMLElement;
            if (card && card.offsetLeft + card.offsetWidth > levelSelectRow.scrollLeft + levelSelectRow.offsetWidth) {
              levelSelectRow.scrollBy({ left: cardWidth, behavior: 'smooth' });
            }
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', throttledResize);
        window.removeEventListener('storage', handleStorageChange);
      }
      if (resizeRafId) cancelAnimationFrame(resizeRafId);

    };
  });
  
  // Reset highlight when carousel moves
  $: if (!isMobile) {
    if (selected > visibleProjects.length - 1) selected = visibleProjects.length - 1;
  }
  
  // Reset start position for mobile
  $: if (isMobile) {
    start = 0;
    selected = 0;
  }
</script>

<svelte:head>
  <title>Projects | HaloPortfolio</title>
</svelte:head>

{#if crtMode}
  <div class="crt-background">
    <div class="tv-frame">
      <div class="crt-overlay"></div>
      <video autoplay loop muted playsinline preload="metadata" class="background-video">
        <source src="/menu_background.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div class="projects-header">Projects</div>
      <div class="menu-bar">
        <button class="arrow left" on:click={prev} aria-label="Previous Projects" disabled={start === 0}>
          <svg viewBox="0 0 32 120" class="arrow-svg" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,0 13,60 32,120" fill="#5ec3ff"/>
            <polygon points="30,6 17,60 30,114" fill="#1976d2"/>
          </svg>
        </button>
        <div class="level-select-row" bind:this={levelSelectRow}>
          {#each visibleProjects as project, i}
            <div class="level-card {selected === i ? 'selected' : ''}">
              <div class="level-img-wrapper">
                <img src={project.image} alt={project.title} class="level-img" loading="lazy" />
              </div>
              <div class="level-title">{project.title}</div>
              <div class="level-desc">{project.description}</div>
            </div>
          {/each}
        </div>
        <button class="arrow right" on:click={next} aria-label="Next Projects" disabled={start + visibleCount >= projects.length}>
          <svg viewBox="0 0 32 120" class="arrow-svg" xmlns="http://www.w3.org/2000/svg">
            <polygon points="0,0 19,60 0,120" fill="#5ec3ff"/>
            <polygon points="2,6 15,60 2,114" fill="#1976d2"/>
          </svg>
        </button>
      </div>
      <div class="back-row">
        <div class="back-label interactive" tabindex="0" role="button" aria-label="Back" on:click={() => history.back()}>= BACK</div>
        <div class="select-label">= SELECT</div>
      </div>
      <div class="tv-stand"></div>
      <div class="tv-base"></div>
    </div>
  </div>
{:else}
  <!-- fallback: render the normal layout, or just the CRT layout always if you prefer -->
  <div class="projects-bg">
    <video autoplay loop muted playsinline preload="metadata" class="background-video">
      <source src="/menu_background.webm" type="video/webm" />
      Your browser does not support the video tag.
    </video>
    <div class="projects-header">Projects</div>
    <div class="menu-bar">
      <button class="arrow left" on:click={prev} aria-label="Previous Projects" disabled={start === 0}>
        <svg viewBox="0 0 32 120" class="arrow-svg" xmlns="http://www.w3.org/2000/svg">
          <polygon points="32,0 13,60 32,120" fill="#5ec3ff"/>
          <polygon points="30,6 17,60 30,114" fill="#1976d2"/>
        </svg>
      </button>
      <div class="level-select-row" bind:this={levelSelectRow}>
        {#each visibleProjects as project, i}
          <div class="level-card {selected === i ? 'selected' : ''}">
            <div class="level-img-wrapper">
              <img src={project.image} alt={project.title} class="level-img" loading="lazy" />
            </div>
            <div class="level-title">{project.title}</div>
            <div class="level-desc">{project.description}</div>
          </div>
        {/each}
      </div>
      <button class="arrow right" on:click={next} aria-label="Next Projects" disabled={start + visibleCount >= projects.length}>
        <svg viewBox="0 0 32 120" class="arrow-svg" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 19,60 0,120" fill="#5ec3ff"/>
          <polygon points="2,6 15,60 2,114" fill="#1976d2"/>
        </svg>
      </button>
    </div>
    <div class="back-row">
      <div class="back-label interactive" tabindex="0" role="button" aria-label="Back" on:click={() => history.back()}>= BACK</div>
      <div class="select-label">= SELECT</div>
    </div>
  </div>
{/if}

<RadioWidget
  audioSrc="/audio/projects_cortana_and_chief.mp3"
  initialSpeaker="cortana"
  speakerTimings={[{time:0,speaker:'cortana'},{time:20,speaker:'chief'},{time:23,speaker:'cortana'},{time:36,speaker:'chief'}]}
  position="left"
  resetOnEnd={false}
/>

<style>
body {
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #222 60%, #111 100%) fixed, url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="%23111111"/><circle cx="50" cy="50" r="40" fill="%23222222" fill-opacity="0.08"/></svg>');
  background-blend-mode: multiply;
  background-size: cover;
  background-repeat: repeat;
  overflow-x: hidden;
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
  z-index: 10;
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
    width: 98vw;
    max-width: 100vw;
    min-width: 0;
    aspect-ratio: 4 / 3;
    border-width: 6px;
    border-radius: 1.2rem;
    box-shadow: 0 0 24px 2px #00bfff33, 0 0 0 12px #222b, 0 4px 16px #000c, 0 0 0 1px #222 inset;
    height: auto;
    max-height: 90vh;
    overflow: hidden;
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
  .projects-header {
    font-size: clamp(0.9rem, 3vw, 1.1rem);
    margin-top: clamp(0.2rem, 1vh, 0.5rem);
    margin-bottom: clamp(0.1rem, 0.5vh, 0.3rem);
    padding-left: 4vw;
    padding-right: 4vw;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  .menu-bar,
  .level-select-row,
  .level-card,
  .level-img-wrapper,
  .level-title,
  .level-desc {
    box-sizing: border-box;
    min-height: 0;
    max-width: 100%;
  }

  .menu-bar {
    flex-direction: column;
    width: 100%;
    height: auto;
    min-height: 60vh;
    flex: 1;
    padding: clamp(0.5rem, 1vh, 1rem) 0;
    overflow: visible;
    justify-content: center;
    align-items: stretch;
    position: relative;
  }

  .level-select-row {
    display: flex;
    flex-direction: row;
    gap: clamp(0.8rem, 2vw, 1.2rem);
    width: 100%;
    padding: clamp(0.5rem, 1vh, 1rem) clamp(0.5rem, 2vw, 1rem);
    padding-left: clamp(1rem, 3vw, 1.5rem);
    height: auto;
    min-height: 50vh;
    max-height: none;
    overflow-x: auto;
    overflow-y: visible;
    scroll-snap-type: x mandatory;
    margin: 0;
    align-items: stretch;
    justify-content: flex-start;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    align-self: center;
  }

  .level-card {
    width: clamp(200px, 75vw, 300px);
    min-width: 200px;
    max-width: 300px;
    height: auto;
    min-height: clamp(300px, 45vh, 400px);
    max-height: none;
    margin: 0;
    scroll-snap-align: start;
    flex: 0 0 auto;
    font-size: clamp(0.6rem, 1.8vh, 1rem);
    padding: clamp(0.8rem, 2vh, 1.2rem);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    overflow: hidden;
    box-sizing: border-box;
    background: rgba(10, 20, 40, 0.95);
    border: clamp(1px, 0.3vh, 2px) solid #1976d2;
    border-radius: clamp(8px, 1.5vh, 12px);
    box-shadow: 0 0 16px #1976d288, 0 0 2px #fff8;
    position: relative;
  }
  
  .level-card:first-child {
    margin-left: clamp(0.5rem, 2vw, 1rem);
  }
  
  .level-card:last-child {
    margin-right: clamp(0.5rem, 2vw, 1rem);
  }

  .level-img-wrapper {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: clamp(6px, 1.5vh, 12px);
    overflow: hidden;
    margin-bottom: clamp(0.8rem, 2vh, 1.2rem);
    border: clamp(1px, 0.3vh, 2px) solid #5ec3ff44;
    background: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-height: clamp(100px, 20vh, 150px);
  }
  .level-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .level-title {
    font-family: 'Xolonium', Arial, sans-serif;
    font-size: clamp(0.8rem, 2.5vh, 1.2rem);
    color: #5ec3ff;
    font-weight: bold;
    margin-bottom: clamp(0.5rem, 1vh, 0.8rem);
    text-shadow: 0 0 8px #5ec3ff88;
    flex-shrink: 0;
    white-space: normal;
    overflow: visible;
    text-overflow: none;
    line-height: 1.2;
  }
  .level-desc {
    font-family: 'Xolonium', Arial, sans-serif;
    font-size: clamp(0.6rem, 1.5vh, 0.8rem);
    color: #5ec3ff;
    opacity: 0.85;
    margin-bottom: clamp(0.5rem, 1vh, 0.8rem);
    text-align: left;
    flex: 1;
    min-height: 0;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 8;
    -webkit-box-orient: vertical;
  }
  .back-row {
    gap: clamp(0.1rem, 1vw, 0.3rem);
    margin-top: clamp(0.1rem, 0.5vh, 0.3rem);
    padding-right: clamp(1rem, 4vw, 2rem);
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  .back-label, .select-label {
    font-size: clamp(0.5rem, 1.5vh, 0.8rem);
  }
  .select-label {
    display: none;
  }
  
  /* Mobile CRT content styling */
  .tv-frame .menu-bar {
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    overflow-x: hidden;
    padding: clamp(0.5rem, 1vh, 1rem) clamp(0.5rem, 2vw, 1rem);
    flex: 1;
    min-height: 50vh;
  }
  
  .tv-frame .level-select-row {
    overflow-x: auto;
    overflow-y: visible;
    padding: clamp(0.5rem, 1vh, 1rem) clamp(0.5rem, 2vw, 1rem);
    flex: 1;
    min-height: 40vh;
  }
  
  .tv-frame .projects-header {
    padding-left: 4vw;
    padding-right: 4vw;
    margin-left: 0;
    flex-shrink: 0;
  }
  
  .tv-frame .back-row {
    flex-shrink: 0;
    padding-left: clamp(0.5rem, 2vw, 1rem);
    padding-right: clamp(0.5rem, 2vw, 1rem);
    margin-top: clamp(0.2rem, 0.5vh, 0.5rem);
    margin-bottom: clamp(0.2rem, 0.5vh, 0.5rem);
  }
  
  /* Enhanced vertical scrolling for the entire CRT content area */
  .tv-frame {
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .tv-frame > * {
    flex-shrink: 0;
  }
  
  .tv-frame .menu-bar {
    flex: 1;
    min-height: 0;
  }
  
  /* Mobile-specific CRT scrollbar styling */
  .tv-frame::-webkit-scrollbar,
  .tv-frame .menu-bar::-webkit-scrollbar,
  .tv-frame .level-select-row::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .tv-frame::-webkit-scrollbar-track,
  .tv-frame .menu-bar::-webkit-scrollbar-track,
  .tv-frame .level-select-row::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }

  .tv-frame::-webkit-scrollbar-thumb,
  .tv-frame .menu-bar::-webkit-scrollbar-thumb,
  .tv-frame .level-select-row::-webkit-scrollbar-thumb {
    background: #5ec3ff;
    border-radius: 3px;
    box-shadow: 0 0 4px #5ec3ff88;
  }

  .tv-frame::-webkit-scrollbar-thumb:hover,
  .tv-frame .menu-bar::-webkit-scrollbar-thumb:hover,
  .tv-frame .level-select-row::-webkit-scrollbar-thumb:hover {
    background: #fff;
  }
  
  /* Smooth scrolling for mobile CRT */
  .tv-frame {
    scroll-behavior: smooth;
  }
  
  .tv-frame .menu-bar {
    scroll-behavior: smooth;
  }
  
  .tv-frame .level-select-row {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
}
.projects-bg {
  min-height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
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
.projects-header {
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
  padding-left: 4%;
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
  margin: 0 auto;
  box-sizing: border-box;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
}
.level-select-row {
  display: flex;
  flex-direction: row;
  gap: clamp(0.5rem, 2vw, 2rem);
  justify-content: left;
  align-items: stretch;
  height: 100%;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  margin: 0;
  padding: clamp(0.2rem, 0.5vw, 0.5rem) clamp(0.2rem, 0.5vw, 0.5rem);
  padding-left: 2rem;
}
.level-card {
  background: rgba(10, 20, 40, 0.95);
  border: clamp(1px, 0.3vh, 3px) solid #1976d2;
  border-radius: clamp(8px, 1.5vh, 18px);
  box-shadow: 0 0 24px #1976d288, 0 0 2px #fff8;
  width: calc(100% / 3);
  min-width: 0;
  max-width: none;
  height: 100%;
  max-height: none;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: clamp(0.3rem, 1vh, 0.7rem) clamp(0.5rem, 1.5vh, 1rem) clamp(0.5rem, 1.5vh, 1rem);
  position: relative;
  transition: box-shadow 0.2s, border-color 0.2s;
  flex: 1 1 0;
  margin: 0;
  overflow: hidden;
}
.level-card:hover {
  border-color: #5ec3ff;
  box-shadow: 0 0 32px #5ec3ffcc, 0 0 8px #fff8;
}
.level-img-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: clamp(4px, 1vh, 10px);
  overflow: hidden;
  margin-bottom: clamp(0.5rem, 1.5vh, 1.2rem);
  border: clamp(1px, 0.2vh, 2px) solid #5ec3ff44;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 1;
  min-height: 0;
}
.level-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.level-title {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(0.8rem, 2.5vh, 1.5rem);
  color: #5ec3ff;
  font-weight: bold;
  margin-bottom: clamp(0.3rem, 1vh, 0.7rem);
  text-shadow: 0 0 8px #5ec3ff88;
  flex-shrink: 1;
  min-height: 0;
}
.level-desc {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(0.6rem, 1.8vh, 1.05rem);
  color: #5ec3ff;
  opacity: 0.85;
  margin-bottom: clamp(0.5rem, 1.5vh, 1.2rem);
  text-align: left;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}
.arrow {
  background: none;
  border: none;
  padding: 0 clamp(0.1rem, 0.2vw, 0.2rem);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: filter 0.2s;
  height: 100%;
  flex-shrink: 0;
}
.arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.arrow-svg {
  display: block;
  height: clamp(120px, 25vh, 320px);
  max-height: 90vh;
  width: auto;
  filter: drop-shadow(0 0 8px #5ec3ff88);
  transition: filter 0.2s;
}
.arrow:hover:not(:disabled) .arrow-svg {
  filter: drop-shadow(0 0 16px #5ec3ffcc);
}
@media (max-width: 1000px) {
  .tv-frame {
    width: 98vw;
    max-width: 100vw;
    border-width: 6px;
    border-radius: 1.2rem;
  }
  .projects-header {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    padding-left: 4%;
  }
}
@media (max-width: 700px) {
  .projects-bg {
    justify-content: center;
    padding-top: 0;
  }
  .projects-header {
    font-size: 2rem;
    margin-bottom: 0.15rem;
    padding-left: 2%;
  }
  .arrow {
    display: none;
  }
  .arrow.left, .arrow.right {
    margin-left: 0;
    margin-right: 0;
  }
  .menu-bar {
    margin-top: 0;
    max-width: 100%;
    justify-content: center;
  }
  .level-select-row {
    gap: 1.2rem;
    padding: 0 0.5rem;
    overflow-x: auto;
  }
  .level-card {
    min-width: clamp(200px, 28%, 280px);
    max-width: 28%;
    width: clamp(200px, 80%, 280px);
    height: auto;
    margin: 0;
    margin-bottom: 0;
    scroll-snap-align: start;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }
  .level-title {
    font-size: clamp(0.5rem, 2vh, 0.7rem);
  }
}
.level-card.selected {
  border-color: #5ec3ff;
  box-shadow: 0 0 32px #5ec3ff, 0 0 8px #5ec3ffcc;
  outline: 2px solid #5ec3ff;
  outline-offset: 2px;
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
}
.back-label, .select-label {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: clamp(1rem, 3vh, 2rem);
  color: #5ec3ff;
  letter-spacing: 0.12em;
  text-shadow: 0 0 8px #5ec3ff88, 0 0 2px #fff8;
  text-transform: uppercase;
  outline: none;
  transition: color 0.2s;
  box-sizing: border-box;
}
.back-label {
  position: relative;
  z-index: 2;
  text-align: right;
  cursor: pointer;
}
.back-label:focus, .back-label:hover {
  color: #fff;
}
.select-label {
  display: block;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 2rem;
  color: #5ec3ff;
  letter-spacing: 0.12em;
  text-shadow: 0 0 8px #5ec3ff88, 0 0 2px #fff8;
  text-transform: uppercase;
}
@media (max-width: 700px) {
  .back-row {
    gap: 0.5rem;
    margin-top: 1rem;
    padding-right: 2%;
  }
  .back-label, .select-label {
    font-size: 1.2rem;
  }
  .select-label {
    display: none;
  }
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
.arrow.left {
  margin-left: clamp(1rem, 6vw, 3rem);
}
.arrow.right {
  margin-right: clamp(1rem, 6vw, 3rem);
}

</style>

