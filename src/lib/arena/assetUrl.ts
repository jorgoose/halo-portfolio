import { dev } from '$app/environment';

const R2_BASE = 'https://pub-cfd1b536da7f445ea0edcd97b6b9b139.r2.dev';

/**
 * Returns the asset URL — local `/filename` in dev, R2 in production.
 */
export function assetUrl(filename: string): string {
	return dev ? `/${filename}` : `${R2_BASE}/${filename}`;
}

/**
 * Returns the base URL for SceneLoader (needs trailing slash or empty path).
 * In dev returns '/', in prod returns the R2 base with trailing slash.
 */
export function assetBaseUrl(): string {
	return dev ? '/' : `${R2_BASE}/`;
}
