import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	// Tauri needs a fixed port to connect the dev server to the WebView
	server: {
		port: 5173,
		strictPort: true
	},

	// Make TAURI_ env vars available in the frontend
	envPrefix: ['VITE_', 'TAURI_ENV_'],

	build: {
		// Tauri on Windows uses Chromium — safe to target modern Chrome
		target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
		minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
		sourcemap: !!process.env.TAURI_ENV_DEBUG
	}
});


