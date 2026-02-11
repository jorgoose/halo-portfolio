<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let crtMode = false;

  // Contact sections data
  const contactSections = [
    {
      title: 'EMAIL',
      content: 'contact.jorgensen@gmail.com',
      type: 'email'
    },
    {
      title: 'LINKEDIN',
      content: 'linkedin.com/in/logan-jorgensen',
      type: 'link'
    },
    {
      title: 'GITHUB',
      content: 'github.com/jorgoose',
      type: 'link'
    },
    {
      title: 'LOCATION',
      content: 'Chicago, IL',
      type: 'text'
    }
  ];

  let selectedSection = 0;
  let menuRefs: HTMLElement[] = [];

  function selectSection(idx: number) {
    selectedSection = idx;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      selectedSection = (selectedSection - 1 + contactSections.length) % contactSections.length;
      menuRefs[selectedSection]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      selectedSection = (selectedSection + 1) % contactSections.length;
      menuRefs[selectedSection]?.focus();
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // Handle contact action based on type
      handleContactAction(selectedSection);
      e.preventDefault();
    }
  }

  function handleContactAction(idx: number) {
    const section = contactSections[idx];
    if (section.type === 'email') {
      window.location.href = `mailto:${section.content}`;
    } else if (section.type === 'link') {
      window.open(`https://${section.content}`, '_blank');
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
      };
    }
  });
</script>

<svelte:head>
  <title>Contact | HaloPortfolio</title>
</svelte:head>

{#if crtMode}
  <div class="crt-background">
    <div class="tv-frame">
      <div class="crt-overlay"></div>
      <video autoplay loop muted playsinline preload="metadata" class="background-video">
        <source src="/menu_background.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div class="contact-header">Contact</div>
      <div class="menu-bar advanced-menu">
        <div class="menu-vertical">
          <div class="menu-list">
            {#each contactSections as section, idx}
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
            <div class="contact-display">
              {#if selectedSection === 0}
                <div class="social-icons">
                  <button class="social-icon" on:click={() => window.location.href = 'mailto:contact.jorgensen@gmail.com'} aria-label="Email">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                      <path fill="#5ec3ff" d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                    </svg>
                  </button>
                </div>
              {:else if selectedSection === 1}
                <div class="social-icons">
                  <button class="social-icon" on:click={() => window.open('https://linkedin.com/in/logan-jorgensen', '_blank')} aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                      <path fill="#5ec3ff" d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M18.5,18.5V13.2A3.26,3.26 0 0,0 15.24,9.94C14.39,9.94 13.4,10.46 12.92,11.24V10.13H10.13V18.5H12.92V13.57C12.92,12.8 13.54,12.17 14.31,12.17A1.4,1.4 0 0,1 15.71,13.57V18.5H18.5M6.88,8.56A1.68,1.68 0 0,0 8.56,6.88C8.56,5.95 7.81,5.19 6.88,5.19A1.69,1.69 0 0,0 5.19,6.88C5.19,7.81 5.95,8.56 6.88,8.56M8.27,18.5V10.13H5.5V18.5H8.27Z" />
                    </svg>
                  </button>
                </div>
              {:else if selectedSection === 2}
                <div class="social-icons">
                  <button class="social-icon" on:click={() => window.open('https://github.com/jorgoose', '_blank')} aria-label="GitHub">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                      <path fill="#5ec3ff" d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
                    </svg>
                  </button>
                </div>
              {:else if selectedSection === 3}
                <div class="social-icons">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#5ec3ff" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z" />
                  </svg>
                </div>
              {/if}
              <div class="section-text">
                {#if contactSections[selectedSection].type === 'email' || contactSections[selectedSection].type === 'link'}
                  <button 
                    class="contact-link" 
                    on:click={() => handleContactAction(selectedSection)}
                    aria-label="Open {contactSections[selectedSection].title}"
                  >
                    {contactSections[selectedSection].content}
                  </button>
                {:else}
                  {contactSections[selectedSection].content}
                {/if}
              </div>
            </div>
          </div>
        </div>
        <div class="contact-icon-area">
          <svg viewBox="0 0 120 120" aria-hidden="true" class="contact-icon-svg" style="filter: drop-shadow(0 0 18px #5ec3ff88);">
            <defs>
              <radialGradient id="contactIconGradient" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#5ec3ff" stop-opacity="0.7" />
                <stop offset="70%" stop-color="#5ec3ff" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#1976d2" stop-opacity="0.18" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="54" stroke="#5ec3ff" stroke-width="8" fill="url(#contactIconGradient)" />
            <!-- Email/Contact icon -->
            <rect x="25" y="35" width="70" height="50" rx="8" ry="8" stroke="#5ec3ff" stroke-width="4" fill="none" />
            <path d="M25 45 L60 65 L95 45" stroke="#5ec3ff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
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
  <div class="contact-bg">
    <video autoplay loop muted playsinline preload="metadata" class="background-video">
      <source src="/menu_background.webm" type="video/webm" />
      Your browser does not support the video tag.
    </video>
    <div class="contact-header">Contact</div>
    <div class="menu-bar advanced-menu">
      <div class="menu-vertical">
        <div class="menu-list">
          {#each contactSections as section, idx}
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
          <div class="contact-display">
            {#if selectedSection === 0}
              <div class="social-icons">
                <button class="social-icon" on:click={() => window.location.href = 'mailto:contact.jorgensen@gmail.com'} aria-label="Email">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#5ec3ff" d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                  </svg>
                </button>
              </div>
            {:else if selectedSection === 1}
              <div class="social-icons">
                <button class="social-icon" on:click={() => window.open('https://linkedin.com/in/logan-jorgensen', '_blank')} aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#5ec3ff" d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M18.5,18.5V13.2A3.26,3.26 0 0,0 15.24,9.94C14.39,9.94 13.4,10.46 12.92,11.24V10.13H10.13V18.5H12.92V13.57C12.92,12.8 13.54,12.17 14.31,12.17A1.4,1.4 0 0,1 15.71,13.57V18.5H18.5M6.88,8.56A1.68,1.68 0 0,0 8.56,6.88C8.56,5.95 7.81,5.19 6.88,5.19A1.69,1.69 0 0,0 5.19,6.88C5.19,7.81 5.95,8.56 6.88,8.56M8.27,18.5V10.13H5.5V18.5H8.27Z" />
                  </svg>
                </button>
              </div>
            {:else if selectedSection === 2}
              <div class="social-icons">
                <button class="social-icon" on:click={() => window.open('https://github.com/jorgoose', '_blank')} aria-label="GitHub">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#5ec3ff" d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
                  </svg>
                </button>
              </div>
            {:else if selectedSection === 3}
              <div class="social-icons">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path fill="#5ec3ff" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z" />
                </svg>
              </div>
            {/if}
            <div class="section-text">
              {#if contactSections[selectedSection].type === 'email' || contactSections[selectedSection].type === 'link'}
                <button 
                  class="contact-link" 
                  on:click={() => handleContactAction(selectedSection)}
                  aria-label="Open {contactSections[selectedSection].title}"
                >
                  {contactSections[selectedSection].content}
                </button>
              {:else}
                {contactSections[selectedSection].content}
              {/if}
            </div>
          </div>
        </div>
      </div>
      <div class="contact-icon-area">
        <svg viewBox="0 0 120 120" aria-hidden="true" class="contact-icon-svg" style="filter: drop-shadow(0 0 18px #5ec3ff88);">
          <defs>
            <radialGradient id="contactIconGradient" cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#5ec3ff" stop-opacity="0.7" />
              <stop offset="70%" stop-color="#5ec3ff" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#1976d2" stop-opacity="0.18" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="54" stroke="#5ec3ff" stroke-width="8" fill="url(#contactIconGradient)" />
          <!-- Email/Contact icon -->
          <rect x="25" y="35" width="70" height="50" rx="8" ry="8" stroke="#5ec3ff" stroke-width="4" fill="none" />
          <path d="M25 45 L60 65 L95 45" stroke="#5ec3ff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
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

.contact-bg {
  min-height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  max-width: 100%;
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

.contact-header {
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

.contact-link {
  background: none;
  border: none;
  color: #5ec3ff;
  font-family: 'Xolonium', Arial, sans-serif;
  font-size: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: color 0.2s, text-decoration-color 0.2s;
  padding: 0;
  margin: 0;
  outline: none;
}

.contact-link:hover, .contact-link:focus {
  color: #fff;
  text-decoration-color: #5ec3ff;
  text-shadow: 0 0 8px #5ec3ff88;
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

.crt-overlay {
  pointer-events: none;
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  z-index: 5;
  border-radius: inherit;
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

@media (max-width: 900px) {
  .tv-frame {
    width: 98vw;
    max-width: 100%;
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
  
  .contact-header {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    padding-left: 4%;
  }
}

@media (max-width: 700px) {
  .crt-background {
    background: url('/CRT_bg.jpeg') 47.5% 55.75% no-repeat;
    background-size: 255%;
  }
  
  .tv-frame {
    width: 98vw;
    max-width: 100%;
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
  
  .contact-header {
    font-size: 1.8rem;
    margin-top: 0.3rem;
    margin-bottom: 0.2rem;
    margin-left: 6vw;
    flex-shrink: 0;
  }
  
  .menu-bar {
    padding: clamp(0.5rem, 2vh, 1rem);
    max-width: 100%;
  }
  
  .section-text {
    font-size: clamp(0.6rem, 2vh, 0.9rem);
  }
  
  .back-row {
    gap: 0.5rem;
    margin-top: 0.3rem;
    margin-bottom: 0.3rem;
    padding-right: 6vw;
    padding-left: 6vw;
    flex-shrink: 0;
    position: relative;
  }
  
  .back-label {
    font-size: 1.2rem;
  }
  
  .menu-item {
    font-size: 0.9rem;
    padding: 0.25rem 0.5rem;
    display: block;
    visibility: visible;
    pointer-events: auto;
  }
  
  .menu-content,
  .section-text {
    font-size: 0.85rem;
    padding: 1rem 0 1rem 0;
    display: block;
    visibility: visible;
  }

  .menu-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    visibility: visible;
  }

  .contact-display {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    visibility: visible;
  }

  .social-icons {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 0.5rem;
    visibility: visible;
  }

  .social-icon {
    visibility: visible;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .menu-vertical {
    height: 50%;
    padding-left: 0.5rem;
  }
  
  .contact-icon-area {
    display: none;
  }
  
  .tv-frame .menu-bar,
  .tv-frame .advanced-menu {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0 !important;
    left: 0;
    right: 0;
    box-sizing: border-box;
    flex: 1;
    height: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .tv-frame .menu-vertical {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
    height: 0 !important;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .tv-frame .menu-list,
  .tv-frame .menu-content {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .tv-frame .menu-item {
    font-size: 0.8rem;
    padding: 0.2rem 0.4rem;
    margin: 0.05rem 0;
    flex-shrink: 0;
    display: block;
    visibility: visible;
    pointer-events: auto;
  }
  
  .tv-frame .menu-list {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    margin-top: 0.3rem;
    margin-bottom: 0.3rem;
    flex-shrink: 0;
  }
  
  .tv-frame .menu-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0.3rem 0 1rem 0;
  }
  
  .tv-frame .section-text {
    font-size: 0.7rem;
    padding: 0.3rem 0;
    flex: 1;
    min-height: 0;
  }
  
  .tv-frame .contact-display {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    visibility: visible;
  }
  
  .tv-frame .social-icons {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  .tv-frame .social-icon {
    visibility: visible;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .tv-frame .contact-header {
    padding-left: 2rem;
    padding-right: 2rem;
    margin-left: 0;
    margin-top: 0.3rem;
    margin-bottom: 0.2rem;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  .tv-frame .back-row {
    margin-top: 0.2rem;
    margin-bottom: 0.2rem;
    padding-right: 2rem;
    padding-left: 2rem;
    flex-shrink: 0;
    position: relative;
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
  
  .contact-bg .menu-item {
    font-size: 0.8rem;
    padding: 0.18rem 0.4rem;
  }
  
  .contact-bg .menu-list {
    gap: 0.18rem;
  }
}

@media (max-width: 1000px) {
  .tv-frame {
    width: 98vw;
    max-width: 100%;
    border-width: 6px;
    border-radius: 1.2rem;
  }
  
  .contact-icon-area {
    display: none !important;
  }
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

/* Non-CRT mode: make menu wider */
:global(.contact-bg) .menu-vertical {
  max-width: 1000px;
}
:global(.contact-bg) .menu-list {
  max-width: 100%;
}

.contact-icon-area {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 100%;
  overflow: hidden;
  margin: auto;
}

.contact-icon-svg {
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

/* CRT mode containment for Contact page */
.tv-frame .menu-bar,
.tv-frame .advanced-menu,
.tv-frame .menu-vertical,
.tv-frame .contact-icon-area {
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

.tv-frame .contact-header {
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

.contact-display {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.social-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.social-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.social-icon:hover {
  background: rgba(94, 195, 255, 0.1);
  transform: scale(1.1);
}

.social-icon:focus {
  outline: 2px solid #5ec3ff;
  outline-offset: 2px;
}

.social-icon svg {
  filter: drop-shadow(0 0 8px #5ec3ff88);
  transition: filter 0.2s;
}

.social-icon:hover svg {
  filter: drop-shadow(0 0 12px #5ec3ffcc);
}

@media (max-width: 700px) {
  .contact-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .social-icons {
    gap: 0.5rem;
  }
  
  .social-icon svg {
    width: 32px;
    height: 32px;
  }
  
  .tv-frame .social-icon svg {
    width: 24px;
    height: 24px;
  }
  
  .tv-frame .contact-display {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>