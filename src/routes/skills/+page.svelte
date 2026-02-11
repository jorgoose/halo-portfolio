<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  let crtMode = false;

  // Skills data
  const skillCategories = [
    {
      title: 'Languages',
      skills: ['Go', 'Python', 'JavaScript', 'TypeScript', 'SQL', 'Java', 'PHP'],
      blurbs: [
        'Go for building fast, concurrent backend services and APIs.',
        'Python for data analysis, machine learning, and backend development.',
        'JavaScript for dynamic web applications and full-stack development.',
        'TypeScript for type-safe, scalable JavaScript applications.',
        'SQL for database design, queries, and data management.',
        'Java for enterprise applications and Android development.',
        'PHP for web development and server-side scripting.'
      ]
    },
    {
      title: 'Libraries',
      skills: ['FastAPI', 'Gin', 'Svelte', 'Next.js', 'React', 'PyTorch', 'OpenCV'],
      blurbs: [
        'FastAPI for building high-performance Python APIs with automatic documentation.',
        'Gin for creating fast, minimalist web services in Go.',
        'Svelte for building reactive, performant user interfaces.',
        'Next.js for full-stack React applications with SSR and routing.',
        'React for building component-based user interfaces.',
        'PyTorch for deep learning and neural network development.',
        'OpenCV for computer vision and image processing tasks.'
      ]
    },
    {
      title: 'Tools',
      skills: ['AWS', 'GCP', 'Docker', 'Git', 'Snowflake', 'PostgreSQL'],
      blurbs: [
        'AWS for cloud infrastructure, serverless computing, and scalable deployments.',
        'Google Cloud Platform for cloud services, ML APIs, and data analytics.',
        'Docker for containerization and consistent deployment environments.',
        'Git for version control, collaboration, and code management.',
        'Snowflake for cloud data warehousing and analytics.',
        'PostgreSQL for relational database design and management.'
      ]
    }
  ];
  let selectedSkillIdx = [0, 0, 0];
  let selectedCategory = 0;

  function prevSkill(catIdx: number) {
    selectedSkillIdx[catIdx] = (selectedSkillIdx[catIdx] - 1 + skillCategories[catIdx].skills.length) % skillCategories[catIdx].skills.length;
    selectedSkillIdx = [...selectedSkillIdx];
  }
  function nextSkill(catIdx: number) {
    selectedSkillIdx[catIdx] = (selectedSkillIdx[catIdx] + 1) % skillCategories[catIdx].skills.length;
    selectedSkillIdx = [...selectedSkillIdx];
  }
  function selectCategory(idx: number) {
    selectedCategory = idx;
  }
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      selectedCategory = (selectedCategory - 1 + skillCategories.length) % skillCategories.length;
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      selectedCategory = (selectedCategory + 1) % skillCategories.length;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      prevSkill(selectedCategory);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      nextSkill(selectedCategory);
      e.preventDefault();
    }
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
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  });
</script>

<svelte:head>
  <title>Skills | HaloPortfolio</title>
</svelte:head>

{#if crtMode}
  <div class="crt-background">
    <div class="tv-frame">
      <div class="crt-overlay"></div>
      <video autoplay loop muted playsinline preload="metadata" class="background-video">
        <source src="/menu_background.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div class="projects-header">Skills</div>
      <div class="menu-bar advanced-menu">
        <div class="menu-vertical">
          <div class="menu-list">
            {#each skillCategories as cat, i}
              <div class="menu-item {selectedCategory === i ? 'selected' : ''}"
                tabindex="0"
                on:click={() => selectCategory(i)}
                aria-selected={selectedCategory === i}
              >
                {cat.title}
              </div>
            {/each}
          </div>
          <div class="menu-content">
            <div class="skills-display">
              <div class="skills-navigation">
                <button class="arrow-btn" on:click={() => prevSkill(selectedCategory)} aria-label="Previous {skillCategories[selectedCategory].title} skill">
                  <svg class="arrow-triangle" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><polygon points="12,2 4,8 12,14" fill="#5ec3ff"/></svg>
                </button>
                <span class="current-skill">{skillCategories[selectedCategory].skills[selectedSkillIdx[selectedCategory]]}</span>
                <button class="arrow-btn" on:click={() => nextSkill(selectedCategory)} aria-label="Next {skillCategories[selectedCategory].title} skill">
                  <svg class="arrow-triangle" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><polygon points="4,2 12,8 4,14" fill="#5ec3ff"/></svg>
                </button>
              </div>
              <div class="skill-description">
                {skillCategories[selectedCategory].blurbs[selectedSkillIdx[selectedCategory]]}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="back-row">
        <div class="back-label interactive" tabindex="0" role="button" aria-label="Back" on:click={() => goto('/')} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto('/'); } }}>= BACK</div>
      </div>
      <div class="tv-stand"></div>
      <div class="tv-base"></div>
    </div>
  </div>
{:else}
  <div class="projects-bg">
    <video autoplay loop muted playsinline preload="metadata" class="background-video">
      <source src="/menu_background.webm" type="video/webm" />
      Your browser does not support the video tag.
    </video>
    <div class="projects-header">Skills</div>
    <div class="menu-bar advanced-menu">
      <div class="menu-vertical">
        <div class="menu-list">
          {#each skillCategories as cat, i}
            <div class="menu-item {selectedCategory === i ? 'selected' : ''}"
              tabindex="0"
              on:click={() => selectCategory(i)}
              aria-selected={selectedCategory === i}
            >
              {cat.title}
            </div>
          {/each}
        </div>
        <div class="menu-content">
          <div class="skills-display">
            <div class="skills-navigation">
              <button class="arrow-btn" on:click={() => prevSkill(selectedCategory)} aria-label="Previous {skillCategories[selectedCategory].title} skill">
                <svg class="arrow-triangle" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><polygon points="12,2 4,8 12,14" fill="#5ec3ff"/></svg>
              </button>
              <span class="current-skill">{skillCategories[selectedCategory].skills[selectedSkillIdx[selectedCategory]]}</span>
              <button class="arrow-btn" on:click={() => nextSkill(selectedCategory)} aria-label="Next {skillCategories[selectedCategory].title} skill">
                <svg class="arrow-triangle" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><polygon points="4,2 12,8 4,14" fill="#5ec3ff"/></svg>
              </button>
            </div>
            <div class="skill-description">
              {skillCategories[selectedCategory].blurbs[selectedSkillIdx[selectedCategory]]}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="back-row">
      <div class="back-label interactive" tabindex="0" role="button" aria-label="Back" on:click={() => goto('/')} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto('/'); } }}>= BACK</div>
    </div>
  </div>
{/if}

<style>

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
  justify-content: flex-start;
  box-sizing: border-box;
  z-index: 2;
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
  .crt-background {
    background: url('/CRT_bg.jpeg') 47.5% 55.75% no-repeat;
    background-size: 255%;
  }
  .tv-frame {
    width: 98vw;
    max-width: 100vw;
    min-width: 0;
    height: auto;
    max-height: 85vh;
    border-width: 6px;
    border-radius: 1.2rem;
    box-shadow: 0 0 24px 2px #00bfff33, 0 0 0 6px #222b, 0 4px 16px #000c, 0 0 0 1px #222 inset;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
    font-size: 1.1rem;
    margin-top: 0.3rem;
    margin-bottom: 0.2rem;
    padding-left: 4vw;
    padding-right: 4vw;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .menu-bar,
  .advanced-menu,
  .menu-vertical,
  .menu-list,
  .menu-item,
  .menu-content {
    box-sizing: border-box;
    min-height: 0;
    max-width: 100%;
  }

  .menu-bar {
    flex-direction: column;
    width: 100%;
    height: 0;
    min-height: 0;
    flex: 1;
    padding: 0;
    overflow: hidden;
    overflow-y: auto;
    justify-content: flex-start;
  }

  .advanced-menu {
    flex-direction: column;
    width: 100%;
    height: 0;
    min-height: 0;
    flex: 1;
    padding: 0;
    overflow: hidden;
    overflow-y: auto;
    justify-content: flex-start;
  }

  .menu-vertical {
    width: 100%;
    height: 100%;
    margin-left: 0;
    margin-right: 0;
    padding: 0 clamp(0.5rem, 2vw, 1rem);
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 100%;
  }

  .menu-list {
    gap: 0.2rem;
    margin-top: 0.3rem;
    overflow-x: hidden;
  }

  .menu-item {
    font-size: 0.9rem;
    padding: 0.3rem 0.8rem;
    margin: 0.05rem 0;
    border-radius: 0.8rem;
    border-width: 2px;
  }

  .menu-content {
    padding: 0.8rem 0;
    font-size: 0.8rem;
    overflow-x: hidden;
  }

  .skills-display {
    gap: 1rem;
    width: 100%;
    overflow-x: hidden;
  }

  .skills-navigation {
    padding: 0.6rem 0.8rem;
    gap: 0.8rem;
    border-radius: 0.8rem;
    border-width: 2px;
  }

  .current-skill {
    font-size: 0.9rem;
    min-width: 80px;
  }

  .skill-description {
    font-size: 0.8rem;
    padding: 0.8rem 1rem;
    line-height: 1.4;
    border-radius: 0.8rem;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  .arrow-btn {
    padding: 0.15rem;
  }

  .arrow-triangle {
    width: 1em;
    height: 1em;
  }

  .back-row {
    gap: clamp(0.1rem, 1vw, 0.3rem);
    margin-top: 0.3rem;
    margin-bottom: 0.3rem;
    padding-right: clamp(1rem, 4vw, 2rem);
    padding-left: clamp(1rem, 4vw, 2rem);
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
    position: relative;
  }

  .back-label {
    font-size: clamp(0.6rem, 2vh, 0.9rem);
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
  justify-content: flex-start;
  z-index: 1;
  margin: 0 auto;
  box-sizing: border-box;
  max-width: 100%;
  padding: 0 clamp(1rem, 3vw, 2rem);
  overflow: hidden;
}

@media (min-width: 701px) {
  .menu-bar {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  /* Desktop non-CRT scrollbar styling */
  .menu-bar::-webkit-scrollbar {
    width: 8px;
  }

  .menu-bar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .menu-bar::-webkit-scrollbar-thumb {
    background: #5ec3ff;
    border-radius: 4px;
    box-shadow: 0 0 4px #5ec3ff88;
  }

  .menu-bar::-webkit-scrollbar-thumb:hover {
    background: #fff;
  }
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
    margin-left: 8vw;
    padding-left: 0;
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
    margin-left: 6vw;
    padding-left: 0;
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

  .menu-vertical {
    margin-left: 5%;
    margin-right: 5%;
    padding: 0;
  }

  .menu-item {
    font-size: 1rem;
    padding: 0.35rem 1rem;
    margin: 0.05rem 0;
    border-radius: 1rem;
  }

  .menu-content {
    padding: 1rem 0 1rem 0;
    font-size: 0.9rem;
  }

  .skills-navigation {
    padding: 0.8rem 1rem;
    gap: 1rem;
  }

  .current-skill {
    font-size: 1.1rem;
    min-width: 100px;
  }

  .arrow-btn {
    padding: 0.2rem;
  }

  .skill-description {
    font-size: 1rem;
    padding: 1rem 1.2rem;
    line-height: 1.5;
  }

  /* CRT mode mobile styles - ensure containment within TV frame */
  .tv-frame .menu-bar,
  .tv-frame .advanced-menu {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    flex: 1;
    height: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(100vh - 12rem);
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }

  .tv-frame .menu-vertical {
    width: 100%;
    height: 0;
    flex: 1;
    min-height: 0;
    margin-left: 0;
    margin-right: 0;
    padding: 0.3rem clamp(0.3rem, 1.5vw, 0.8rem) 0.5rem;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
  }

  .tv-frame .menu-list {
    gap: 0.15rem;
    margin-top: 0.2rem;
    margin-bottom: 0.3rem;
    overflow-x: hidden;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 3;
  }

  .tv-frame .menu-item {
    font-size: 0.8rem;
    padding: 0.25rem 0.6rem;
    margin: 0.03rem 0;
    border-radius: 0.6rem;
    border-width: 1.5px;
    flex-shrink: 0;
    display: block;
    visibility: visible;
    pointer-events: auto;
  }

  .tv-frame .menu-content {
    padding: 0.3rem 0 1rem 0;
    font-size: 0.7rem;
    overflow-x: hidden;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    visibility: visible;
  }

  .tv-frame .skills-display {
    gap: 0.8rem;
    width: 100%;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .tv-frame .skills-navigation {
    padding: 0.5rem 0.6rem;
    gap: 0.6rem;
    border-radius: 0.6rem;
    border-width: 1.5px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    visibility: visible;
  }

  .tv-frame .current-skill {
    font-size: 0.8rem;
    min-width: 70px;
    display: block;
    visibility: visible;
  }

  .tv-frame .skill-description {
    font-size: 0.7rem;
    padding: 0.6rem 0.8rem;
    line-height: 1.3;
    border-radius: 0.6rem;
    overflow-wrap: break-word;
    word-wrap: break-word;
    flex: 1;
    min-height: 0;
    display: block;
    visibility: visible;
  }

  .tv-frame .arrow-btn {
    padding: 0.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: visible;
    pointer-events: auto;
    flex-shrink: 0;
  }

  .tv-frame .arrow-triangle {
    width: 0.9em;
    height: 0.9em;
    display: block;
    visibility: visible;
  }

  .tv-frame .projects-header {
    padding-left: 2rem;
    padding-right: 2rem;
    margin-left: 0;
    margin-top: 0.3rem;
    margin-bottom: 0.2rem;
    font-size: 1rem;
    flex-shrink: 0;
  }

  /* Custom scrollbar styling for mobile CRT mode */
  .tv-frame .menu-vertical::-webkit-scrollbar,
  .tv-frame .advanced-menu::-webkit-scrollbar,
  .tv-frame .menu-bar::-webkit-scrollbar {
    width: 4px;
  }

  .tv-frame .menu-vertical::-webkit-scrollbar-track,
  .tv-frame .advanced-menu::-webkit-scrollbar-track,
  .tv-frame .menu-bar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }

  .tv-frame .menu-vertical::-webkit-scrollbar-thumb,
  .tv-frame .advanced-menu::-webkit-scrollbar-thumb,
  .tv-frame .menu-bar::-webkit-scrollbar-thumb {
    background: #5ec3ff;
    border-radius: 2px;
    box-shadow: 0 0 3px #5ec3ff88;
  }

  .tv-frame .menu-vertical::-webkit-scrollbar-thumb:hover,
  .tv-frame .advanced-menu::-webkit-scrollbar-thumb:hover,
  .tv-frame .menu-bar::-webkit-scrollbar-thumb:hover {
    background: #fff;
  }

  .tv-frame .back-row {
    margin-top: 0.2rem;
    margin-bottom: 0.2rem;
    padding-right: 2rem;
    padding-left: 2rem;
    flex-shrink: 0;
    position: relative;
  }
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

@media (max-width: 700px) {
  .back-row {
    gap: 0.5rem;
    margin-top: 1rem;
    padding-right: 2%;
  }
  .back-label {
    font-size: 1.2rem;
  }
}
.crt-overlay {
  pointer-events: none;
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  z-index: 5;
  border-radius: inherit;
  mix-blend-mode: lighten;
  /* Scanlines */
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(0,0,0,0.13) 0px,
      rgba(0,0,0,0.13) 2px,
      transparent 3px,
      transparent 6px
    ),
    /* RGB subpixel pattern */
    repeating-linear-gradient(
      to right,
      rgba(255,0,0,0.07) 0px, rgba(255,0,0,0.07) 1px,
      rgba(0,255,0,0.07) 1px, rgba(0,255,0,0.07) 2px,
      rgba(0,0,255,0.07) 2px, rgba(0,0,255,0.07) 3px
    ),
    /* Vignette */
    radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.22) 100%);
  animation: crt-flicker 1.2s infinite steps(2);
}
@keyframes crt-flicker {
  0% { opacity: 0.97; }
  50% { opacity: 1; }
  100% { opacity: 0.97; }
}

.advanced-menu {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  max-width: 100%;
  margin: 0;
  background: rgba(10, 20, 40, 0.85);
  box-shadow: 0 0 32px #1976d288, 0 0 2px #fff8;
  border-top: clamp(1px, 0.3vh, 3px) solid #1976d2;
  border-bottom: clamp(1px, 0.3vh, 3px) solid #1976d2;
  border-radius: 0;
  padding: 0;
  min-height: 320px;
  justify-content: flex-start;
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

.skills-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  width: 100%;
}

.skills-navigation {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: rgba(20, 30, 50, 0.7);
  border-radius: 1.2rem;
  border: 2px solid #1976d2;
  box-shadow: 0 0 8px #1976d288;
}

.current-skill {
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 8px #5ec3ff88;
  min-width: 120px;
  text-align: center;
}

.arrow-btn {
  background: none;
  border: none;
  color: #5ec3ff;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 0.7rem;
  transition: background 0.2s, color 0.2s;
  outline: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-btn:hover .arrow-triangle, .arrow-btn:focus .arrow-triangle {
  filter: drop-shadow(0 0 4px #5ec3ffcc);
  fill: #fff;
}

.arrow-triangle {
  display: block;
  width: 1.2em;
  height: 1.2em;
  transition: fill 0.2s, filter 0.2s;
}

.skill-description {
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: 1.2rem;
  color: #5ec3ff;
  opacity: 0.9;
  line-height: 1.6;
  text-align: left;
  padding: 1.5rem 1.8rem;
  background: rgba(10, 20, 40, 0.7);
  border-radius: 1.2rem;
  box-shadow: 0 0 8px #1976d288;
  width: 100%;
  box-sizing: border-box;
}

/* CRT mode containment for Skills page */
.tv-frame .menu-bar,
.tv-frame .advanced-menu,
.tv-frame .menu-vertical {
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

.tv-frame .projects-header {
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
  width: 6px;
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
</style>

