import { page } from '@vitest/browser/context';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('Home Page (+page.svelte)', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	it('should render main heading', async () => {
		render(Page);
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});

	it('should render all menu items', async () => {
		render(Page);
		
		// Check that all menu items are present
		const menuItems = ['ABOUT', 'EXPERIENCE', 'PROJECTS', 'SKILLS', 'CONTACT', 'ARENA'];
		
		for (const item of menuItems) {
			const menuItem = page.getByText(item);
			await expect.element(menuItem).toBeInTheDocument();
		}
	});

	it('should have correct navigation links', async () => {
		render(Page);
		
		// Check that menu items have correct href attributes
		const aboutLink = page.getByRole('link', { name: 'ABOUT' });
		const experienceLink = page.getByRole('link', { name: 'EXPERIENCE' });
		const projectsLink = page.getByRole('link', { name: 'PROJECTS' });
		const skillsLink = page.getByRole('link', { name: 'SKILLS' });
		const contactLink = page.getByRole('link', { name: 'CONTACT' });
		const arenaLink = page.getByRole('link', { name: 'ARENA' });

		await expect.element(aboutLink).toHaveAttribute('href', '/about');
		await expect.element(experienceLink).toHaveAttribute('href', '/experience');
		await expect.element(projectsLink).toHaveAttribute('href', '/projects');
		await expect.element(skillsLink).toHaveAttribute('href', '/skills');
		await expect.element(contactLink).toHaveAttribute('href', '/contact');
		await expect.element(arenaLink).toHaveAttribute('href', '/arena');
	});

	it('should toggle CRT mode', async () => {
		render(Page);
		
		// Find CRT mode toggle button
		const crtToggle = page.getByText('CRT MODE');
		await expect.element(crtToggle).toBeInTheDocument();
		
		// Click to toggle CRT mode
		await crtToggle.click();
		
		// Check that localStorage was updated
		expect(localStorage.getItem('crtMode')).toBe('true');
	});

	it('should render video element', async () => {
		render(Page);
		
		// Wait for video element to be rendered
		await new Promise(resolve => setTimeout(resolve, 100));
		
		const video = document.querySelector('video');
		expect(video).toBeInTheDocument();
		expect(video).toHaveAttribute('autoplay');
		expect(video).toHaveAttribute('loop');
		expect(video).toHaveAttribute('playsinline');
		
		// Check muted property (boolean attributes may not appear as DOM attributes)
		expect(video?.muted).toBe(true);
	});

	it('should render radio widget', async () => {
		render(Page);
		
		const radioWidget = document.querySelector('.radio-widget');
		expect(radioWidget).toBeInTheDocument();
	});

	it('should handle keyboard navigation', async () => {
		render(Page);
		
		// Test that menu items are focusable
		const firstMenuItem = page.getByRole('link', { name: 'ABOUT' });
		await expect.element(firstMenuItem).toBeInTheDocument();
		
		// Focus the element using DOM API
		const linkElement = document.querySelector('a[href="/about"]');
		if (linkElement) {
			(linkElement as HTMLElement).focus();
			expect(document.activeElement).toBe(linkElement);
		}
	});

	it('should preserve CRT mode from localStorage', async () => {
		// Set CRT mode in localStorage before rendering
		localStorage.setItem('crtMode', 'true');
		
		render(Page);
		
		// Check that CRT mode elements are present
		const crtBackground = document.querySelector('.crt-background');
		expect(crtBackground).toBeInTheDocument();
	});

	it('should show video autoplay notification when needed', async () => {
		render(Page);
		
		// This test would need to be adapted based on how you want to test
		// the video autoplay failure detection
		const videoNotification = document.querySelector('.video-notification');
		// Note: This might not always be visible depending on browser/conditions
		// This test is placeholder and may need adjustment based on actual implementation
	});
});
